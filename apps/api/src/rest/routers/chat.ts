import { openai } from "@ai-sdk/openai";
import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import {
  extractTextContent,
  generateTitle,
  hasEnoughContent,
} from "@api/ai/generate-title";
import { createToolRegistry } from "@api/ai/tool-types";
import type { ChatMessageMetadata } from "@api/ai/types";
import { formatToolCallTitle } from "@api/ai/utils/format-tool-call-title";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { getChatById, saveChat, saveChatMessage } from "@midday/db/queries";
import { logger } from "@midday/logger";
import {
  convertToModelMessages,
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

      const previousMessagesList = previousMessages?.messages || [];
      const allMessagesForValidation = [...previousMessagesList, message];

      // Validate messages to ensure they're properly formatted
      const validatedMessages = await validateUIMessages({
        messages: allMessagesForValidation,
      });

      // Use only the last MAX_MESSAGES_IN_CONTEXT messages for context
      const originalMessages = validatedMessages.slice(
        -MAX_MESSAGES_IN_CONTEXT,
      );

      // Check if we need a title (no existing title)
      const needsTitle = !previousMessages?.title;

      // Variable to store generated title for saving with chat
      let generatedTitle: string | null = null;

      // Generate title if conversation has enough combined content
      const allMessages = [...(previousMessages?.messages || []), message];
      const shouldGenerateTitle = needsTitle && hasEnoughContent(allMessages);

      if (shouldGenerateTitle) {
        try {
          let messageContent: string;

          if (isToolCallMessage) {
            const { toolName, toolParams } = messageMetadata.toolCall!;
            // Generate a descriptive title for tool calls using registry metadata
            messageContent = formatToolCallTitle(toolName, toolParams);
          } else {
            // Use combined text from all messages for better context
            messageContent = extractTextContent(allMessages);
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
          onFinish: async ({ isContinuation, responseMessage }) => {
            if (isContinuation) {
              // If this is a continuation, save/update the chat with title if generated
              await saveChat(db, {
                chatId: id,
                teamId,
                userId,
                title: generatedTitle,
              });

              // Only save the new AI response message
              await saveChatMessage(db, {
                chatId: id,
                teamId,
                userId,
                message: responseMessage,
              });
            } else {
              // If this is a new conversation, create the chat with title if generated
              await saveChat(db, {
                chatId: id,
                teamId,
                userId,
                title: generatedTitle, // Generate title if first message has enough content
              });

              // Save user message
              const userMessage = originalMessages[originalMessages.length - 1];
              if (userMessage) {
                await saveChatMessage(db, {
                  chatId: id,
                  teamId,
                  userId,
                  message: userMessage,
                });
              }

              // Save AI response
              await saveChatMessage(db, {
                chatId: id,
                teamId,
                userId,
                message: responseMessage,
              });
            }
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
                console.error(error);
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
