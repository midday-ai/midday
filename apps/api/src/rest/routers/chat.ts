import { openai } from "@ai-sdk/openai";
import { getRevenueTool } from "@api/ai/tools/get-revenue";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { chatCache } from "@midday/cache/chat-cache";
import { getTeamById, getUserById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import {
  convertToModelMessages,
  createIdGenerator,
  generateId,
  smoothStream,
  streamText,
} from "ai";
import { HTTPException } from "hono/http-exception";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.post(
  "/",
  withRequiredScope("chat.write"),
  zValidator("json", chatRequestSchema),
  async (c) => {
    const startTime = Date.now();
    const db = c.get("db");
    const { message, id } = c.req.valid("json");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const userId = session.user.id;

    try {
      // Get or cache user context
      let userContext = await chatCache.getUserContext(userId, teamId);
      if (!userContext) {
        const [team, user] = await Promise.all([
          getTeamById(db, teamId),
          getUserById(db, userId),
        ]);

        if (!team || !user) {
          throw new HTTPException(404, { message: "User or team not found" });
        }

        userContext = {
          userId,
          teamId,
          teamName: team.name,
          fullName: user.fullName,
          baseCurrency: team.baseCurrency,
          countryCode: team.countryCode,
          locale: user.locale ?? "en-US",
          dateFormat: user.dateFormat,
        };

        // Cache for future requests
        await chatCache.setUserContext(userId, teamId, userContext);
      }

      // Generate chat ID for logging (no persistence for now)
      const currentChatId = id || generateId();

      // Use only the last message (frontend handles history via initialMessages)
      const messages = [
        {
          ...message,
          id: message.id || generateId(),
          parts: message.parts || [],
        },
      ];

      logger.info({
        msg: "Starting chat request",
        userId,
        teamId,
        chatId: currentChatId,
        messagesCount: messages.length,
        isNewChat: !id,
      });

      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: `You are a helpful AI assistant for Midday, a financial management platform. 
        You help users with:
        - Financial insights and analysis
        - Invoice management
        - Transaction categorization
        - Time tracking
        - Business reporting
        - General financial advice

        Be helpful, professional, and concise in your responses.
        Output titles for sections when it makes sense.
        
        Current team: ${userContext.teamName}
        Current full name: ${userContext.fullName}
        Current date: ${new Date().toISOString().split("T")[0]}
        Company country: ${userContext.countryCode}
        Base currency: ${userContext.baseCurrency}
        `,
        messages: convertToModelMessages(messages),
        temperature: 0.7,
        experimental_transform: smoothStream({
          chunking: "word",
        }),
        tools: {
          getRevenue: getRevenueTool({ db, teamId, userId }),
        },
        onFinish: async (result) => {
          // Log completion metrics
          const responseTime = Date.now() - startTime;
          logger.info({
            msg: "Chat response completed",
            userId,
            teamId,
            chatId: currentChatId,
            responseTime,
            text: result.text,
            usage: result.usage,
          });
        },
      });

      const response = result.toUIMessageStreamResponse({
        originalMessages: messages,
        generateMessageId: createIdGenerator({
          prefix: "msg",
          size: 16,
        }),
      });

      logger.info({
        msg: "Returning stream response",
        userId,
        teamId,
        chatId: currentChatId,
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
