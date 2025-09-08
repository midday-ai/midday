import { openai } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import { generateTitle } from "@api/ai/generate-title";
import { createToolRegistry } from "@api/ai/tools/registry";
import type { ChatMessageMetadata, UIChatMessage } from "@api/ai/types";
import { formatToolCallTitle } from "@api/ai/utils/format-tool-call-title";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { getChatById, saveChat } from "@midday/db/queries";
import { logger } from "@midday/logger";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
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
    const db = c.get("db");
    const { message, id, country, city, region, timezone } =
      c.req.valid("json");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const userId = session.user.id;

    try {
      const [userContext, previousMessages] = await Promise.all([
        getUserContext({
          db,
          userId,
          teamId,
          country,
          city,
          region,
          timezone,
        }),
        getChatById(db, id, teamId),
      ]);

      // Check if this is a forced tool call message
      const messageMetadata = message.metadata as ChatMessageMetadata;
      const isToolCallMessage = messageMetadata?.toolCall;

      // Prepare original messages for the new pattern
      const originalMessages = [
        ...(previousMessages
          ? previousMessages.messages.slice(-MAX_MESSAGES_IN_CONTEXT)
          : []),
        message,
      ];

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

      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          originalMessages,
          onFinish: async ({ messages: streamMessages }) => {
            const allMessages = [
              ...(previousMessages?.messages || []),
              message,
              ...streamMessages,
            ];

            await saveChat(db, {
              chatId: id,
              messages: allMessages as UIChatMessage[],
              teamId,
              userId,
              title: generatedTitle,
            });
          },
          execute: ({ writer }) => {
            // Stream title immediately if generated
            if (generatedTitle) {
              writer.write({
                type: "data-title",
                id: "chat-title",
                data: {
                  title: generatedTitle,
                },
              });
            }

            const result = streamText({
              model: openai("gpt-4o-mini"),
              system: generateSystemPrompt(userContext, isToolCallMessage),
              messages: convertToModelMessages(originalMessages),
              temperature: 0.7,
              stopWhen: stepCountIs(10),
              experimental_transform: smoothStream({
                chunking: "word",
              }),
              tools: createToolRegistry({
                db,
                writer,
                user: userContext,
              }),
              onError: (error) => {
                logger.error({
                  msg: "Error communicating with AI",
                  userId,
                  teamId,
                  chatId: id,
                  error: error instanceof Error ? error.message : String(error),
                });
              },
            });

            result.consumeStream();
            writer.merge(
              result.toUIMessageStream({
                sendStart: false,
              }),
            );
          },
        }),
      });
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
