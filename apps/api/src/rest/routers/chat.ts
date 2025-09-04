import { openai } from "@ai-sdk/openai";
import { getRevenueTool } from "@api/ai/tools/get-revenue";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { chatCache } from "@midday/cache/chat-cache";
import { getTeamById, getUserById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { convertToModelMessages, smoothStream, streamText } from "ai";
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
    const { messages } = c.req.valid("json");
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

      logger.info({
        msg: "Starting chat request",
        userId,
        teamId,
        messagesCount: messages.length,
        messages: JSON.stringify(messages, null, 2),
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
        onFinish: (result) => {
          // Log completion metrics
          const responseTime = Date.now() - startTime;
          logger.info({
            msg: "Chat response completed",
            userId,
            teamId,
            responseTime,
            text: result.text,
            usage: result.usage,
          });
        },
      });

      const response = result.toUIMessageStreamResponse();
      logger.info({
        msg: "Returning stream response",
        userId,
        teamId,
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
