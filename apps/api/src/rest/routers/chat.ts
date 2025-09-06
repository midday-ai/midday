import { openai } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import { generateTitle } from "@api/ai/generate-title";
import {
  type ToolName,
  createToolRegistry,
  validateToolParams,
} from "@api/ai/tools/registry";
import type { ChatMessageMetadata, UIChatMessage } from "@api/ai/types";
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
  type ToolChoice,
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

      // Debug logging for database messages
      logger.info({
        msg: "Previous messages loaded from database",
        chatId: id,
        hasPreviousMessages: !!previousMessages,
        previousMessageCount: previousMessages?.messages?.length || 0,
        previousTitle: previousMessages?.title,
        previousMessageIds: previousMessages?.messages?.map((m) => m.id) || [],
      });

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

      // Check if this is a forced tool call message
      const messageMetadata = message.metadata as ChatMessageMetadata;
      const isToolCallMessage = messageMetadata?.toolCall;
      let toolChoice: ToolChoice<typeof tools> | "auto" = "auto";
      let forcedToolCall:
        | { toolName: string; toolParams: Record<string, any> }
        | undefined;

      if (isToolCallMessage) {
        const { toolName, toolParams } = messageMetadata.toolCall!;

        try {
          // Validate tool parameters
          validateToolParams(toolName as ToolName, toolParams);

          // Set tool choice to force the specific tool (cast to the proper type)
          toolChoice = {
            type: "tool",
            toolName: toolName as keyof typeof tools,
          };

          // Prepare forced tool call data for system prompt
          forcedToolCall = { toolName, toolParams };

          logger.info({
            msg: "Forcing tool execution",
            toolName,
            toolParams,
            chatId: id,
          });
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
        toolChoice,
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

      // Generate title if needed for streaming
      if (needsTitle && message) {
        try {
          let messageContent: string;

          if (isToolCallMessage) {
            const { toolName, toolParams } = messageMetadata.toolCall!;
            // Generate a descriptive title for tool calls using registry metadata
            messageContent = formatToolCallTitle(toolName, toolParams);
          } else {
            // Regular message content
            messageContent =
              message.parts?.find((part) => part.type === "text")?.text || "";
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

          logger.info({
            msg: "Chat title generated",
            chatId: id,
            title: generatedTitle,
            userId,
            teamId,
          });
        } catch (error) {
          logger.error({
            msg: "Failed to generate chat title",
            chatId: id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Start the main AI response - use single system prompt for all cases
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: generateSystemPrompt(userContext, forcedToolCall),
        messages: convertToModelMessages(validatedMessages),
        temperature: 0.7,
        toolChoice,
        stopWhen: [
          stepCountIs(5),
          ({ steps }) => {
            return steps.some((step) => {
              return step.content?.some(
                (content) => content.type === "tool-result",
              );
            });
          },
        ],
        experimental_transform: smoothStream({
          chunking: "word",
          delayInMs: 0,
        }),
        tools,
        onFinish: async (result) => {
          const responseTime = Date.now() - startTime;

          logger.info({
            msg: "Chat response completed",
            userId,
            teamId,
            chatId: id,
            responseTime,
            text: result.text,
            usage: result.usage,
            toolChoice,
          });
        },
      });

      // Use hybrid approach: createUIMessageStream for title streaming + proper message persistence
      const stream = createUIMessageStream({
        generateId: createIdGenerator({
          prefix: "msg",
          size: 16,
        }),
        onFinish: async ({ messages: streamMessages }) => {
          const allMessages = [
            ...(previousMessages?.messages || []),
            message, // Current user message
            ...streamMessages, // AI response(s)
          ];

          logger.info({
            msg: "Saving chat messages to database",
            chatId: id,
            messageCount: allMessages.length,
            messageIds: allMessages.map((m) => m.id),
            messageRoles: allMessages.map((m) => m.role),
            title: generatedTitle,
          });

          await saveChat(db, {
            chatId: id,
            messages: allMessages as UIChatMessage[],
            teamId,
            userId,
            title: generatedTitle,
          });

          logger.info({
            msg: "Chat messages saved successfully",
            chatId: id,
            totalMessages: allMessages.length,
          });
        },
        execute: async ({ writer }) => {
          // Stream title immediately if generated
          if (generatedTitle) {
            writer.write({
              type: "data-title",
              id: "chat-title",
              data: {
                title: generatedTitle,
              },
            });

            logger.info({
              msg: "Chat title streamed to UI",
              chatId: id,
              title: generatedTitle,
              userId,
              teamId,
            });
          }

          // Merge the AI response stream
          writer.merge(result.toUIMessageStream());
        },
      });

      const response = createUIMessageStreamResponse({ stream });

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
