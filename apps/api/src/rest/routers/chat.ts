import { openai } from "@ai-sdk/openai";
import {
  generateForcedToolCallPrompt,
  generateSystemPrompt,
} from "@api/ai/generate-system-prompt";
import { generateTitle } from "@api/ai/generate-title";
import {
  type ToolName,
  createToolRegistry,
  validateToolParams,
} from "@api/ai/tools/registry";
import { formatToolCallTitle } from "@api/ai/utils/format-tool-call-title";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { chatCache } from "@midday/cache/chat-cache";
import {
  getChatById,
  getTeamById,
  getUserById,
  saveChat,
} from "@midday/db/queries";
import { logger } from "@midday/logger";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  validateUIMessages,
} from "ai";
import { HTTPException } from "hono/http-exception";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

const MAX_MESSAGES_IN_CONTEXT = 20;

app.post(
  "/",
  withRequiredScope("chat.write"),
  zValidator("json", chatRequestSchema),
  async (c) => {
    const startTime = Date.now();
    const db = c.get("db");
    const { message, id, country, city, region, timezone } =
      c.req.valid("json");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const userId = session.user.id;

    try {
      if (!id) {
        throw new HTTPException(400, { message: "Chat ID is required" });
      }

      const [userContext, previousMessages] = await Promise.all([
        chatCache.getUserContext(userId, teamId).then(async (cached) => {
          if (cached) return cached;

          // If not cached, fetch team and user data in parallel
          const [team, user] = await Promise.all([
            getTeamById(db, teamId),
            getUserById(db, userId),
          ]);

          if (!team || !user) {
            throw new HTTPException(404, {
              message: "User or team not found",
            });
          }

          const context = {
            userId,
            teamId,
            teamName: team.name,
            fullName: user.fullName,
            baseCurrency: team.baseCurrency,
            locale: user.locale ?? "en-US",
            dateFormat: user.dateFormat,
            country,
            city,
            region,
            timezone,
          };

          // Cache for future requests (non-blocking)
          chatCache.setUserContext(userId, teamId, context).catch((err) => {
            logger.warn({
              msg: "Failed to cache user context",
              userId,
              teamId,
              error: err.message,
            });
          });

          return context;
        }),

        getChatById(db, id, teamId),
      ]);

      const toolRegistry = createToolRegistry({
        db,
        teamId,
        userId,
        locale: userContext.locale,
      });

      const tools = {
        ...toolRegistry,
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: "medium",
          userLocation: {
            type: "approximate",
            country: userContext.country ?? undefined,
            city: userContext.city ?? undefined,
            region: userContext.region ?? undefined,
          },
        }),
      };

      // Check if this is a hidden tool call message
      const messageMetadata = message.metadata as any;
      const isToolCallMessage = messageMetadata?.toolCall;
      let shouldForceToolCall = false;
      let forcedToolName: string | undefined;
      let forcedToolParams: Record<string, any> | undefined;

      if (isToolCallMessage) {
        const { toolName, toolParams } = messageMetadata.toolCall;

        try {
          // Validate tool parameters
          validateToolParams(toolName as ToolName, toolParams);
          shouldForceToolCall = true;
          forcedToolName = toolName;
          forcedToolParams = toolParams;
        } catch (error) {
          throw new HTTPException(400, {
            message: `Invalid tool parameters: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      // Debug logging to see what messages we're receiving
      logger.info({
        msg: "Processing chat message",
        isToolCallMessage,
        shouldForceToolCall,
        forcedToolName,
        messageId: message.id,
        messageRole: message.role,
        hasMetadata: !!messageMetadata,
      });

      const validatedMessages = await validateUIMessages({
        // append the new message to the previous messages:
        // Only keep recent messages for context
        messages: [
          ...(previousMessages
            ? previousMessages.messages.slice(-MAX_MESSAGES_IN_CONTEXT)
            : []),
          message,
        ],
        // @ts-ignore
        tools,
      });

      // Check if this chat needs a title (title is null)
      const needsTitle = !previousMessages?.title;

      // Variable to store generated title for saving with chat
      let generatedTitle: string | null = null;

      // Create a UI message stream to handle early title streaming
      const stream = createUIMessageStream({
        generateId: createIdGenerator({
          prefix: "msg",
          size: 16,
        }),
        onFinish: async ({ messages: finalMessages }) => {
          // Save chat messages with title if it was generated
          await saveChat(db, {
            chatId: id,
            messages: finalMessages,
            teamId,
            userId,
            title: generatedTitle,
          });
        },
        execute: async ({ writer }) => {
          // Generate and stream title immediately if chat doesn't have one
          if (needsTitle && message) {
            try {
              let messageContent: string;

              if (isToolCallMessage && forcedToolName && forcedToolParams) {
                // Generate a descriptive title for tool calls using registry metadata
                messageContent = formatToolCallTitle(
                  forcedToolName,
                  forcedToolParams,
                );
              } else {
                // Regular message content
                messageContent =
                  message.parts?.find((part) => part.type === "text")?.text ||
                  "";
              }

              generatedTitle = await generateTitle({
                message: messageContent,
                teamName: userContext.teamName,
                fullName: userContext.fullName,
                country: userContext.country,
                baseCurrency: userContext.baseCurrency,
                city: userContext.city,
                region: userContext.region,
                timezone: userContext.timezone,
              });

              // Stream the title immediately as a data part
              writer.write({
                type: "data-title",
                id: "chat-title",
                data: {
                  title: generatedTitle,
                },
              });

              logger.info({
                msg: "Chat title streamed early",
                chatId: id,
                title: generatedTitle,
                userId,
                teamId,
              });

              // Title will be saved with the chat in onFinish callback
            } catch (error) {
              logger.error({
                msg: "Failed to generate chat title for early streaming",
                chatId: id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          // Start the main AI response
          const systemPrompt =
            shouldForceToolCall && forcedToolName && forcedToolParams
              ? generateForcedToolCallPrompt(
                  userContext,
                  forcedToolName,
                  forcedToolParams,
                )
              : generateSystemPrompt(userContext);

          const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages: convertToModelMessages(validatedMessages),
            temperature: 0.7,
            stopWhen: [
              stepCountIs(5),
              // Stop if we've made a tool call for forced tool calls
              ({ steps }) => {
                if (shouldForceToolCall && forcedToolName) {
                  return steps.some((step) => {
                    return step.content?.some(
                      (content) =>
                        content.type === "tool-result" &&
                        content.toolName === forcedToolName,
                    );
                  });
                }
                return false;
              },
            ],
            experimental_transform: smoothStream({
              chunking: "word",
              delayInMs: 0,
            }),
            tools,
            onFinish: async (result: any) => {
              const responseTime = Date.now() - startTime;

              logger.info({
                msg: "Chat response completed",
                userId,
                teamId,
                chatId: id,
                responseTime,
                text: result.text,
                usage: result.usage,
              });
            },
          });

          // Convert to UI message stream and merge with our custom stream
          writer.merge(result.toUIMessageStream());
        },
      });

      const response = createUIMessageStreamResponse({
        stream,
      });

      return response;
    } catch (error) {
      logger.error({
        msg: "Chat request failed",
        userId,
        teamId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof HTTPException) {
        throw error;
      }

      return c.json(
        {
          error: "Failed to process chat request",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  },
);

export { app as chatRouter };
