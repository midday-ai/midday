import { openai } from "@ai-sdk/openai";
import { getRevenueTool } from "@api/ai/tools/get-revenue";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { chatCache } from "@midday/cache/chat-cache";
import { getTeamById, getUserById } from "@midday/db/queries";
import { logger } from "@midday/logger";
import { smoothStream, streamText } from "ai";
import { createDataStream } from "ai";
import { HTTPException } from "hono/http-exception";
import { stream } from "hono/streaming";
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
      // Rate limiting: 30 requests per minute per user
      const rateLimitCount = await chatCache.incrementRateLimit(userId);
      if (rateLimitCount > 30) {
        throw new HTTPException(429, {
          message:
            "Too many requests. Please wait a minute before trying again.",
        });
      }

      // Get or cache user context
      let userContext = await chatCache.getUserContext(userId);
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
        };

        // Cache for future requests
        await chatCache.setUserContext(userId, userContext);
      }

      // Use current messages only (no history storage)
      const contextMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const dataStream = createDataStream({
        execute: async (dataStreamWriter) => {
          const result = streamText({
            model: openai("gpt-4o-mini"),
            messages: contextMessages,
            system: `You are a helpful AI assistant for Midday, a financial management platform. 
            You help users with:
            - Financial insights and analysis
            - Invoice management
            - Transaction categorization
            - Time tracking
            - Business reporting
            - General financial advice

            Be helpful, professional, and concise in your responses.
            
            Current team: ${userContext.teamName}
            Current full name: ${userContext.fullName}
            Current date: ${new Date().toISOString().split("T")[0]}
            Company country: ${userContext.countryCode}
            Base currency: ${userContext.baseCurrency}
            `,
            temperature: 0.7,
            maxTokens: 1000,
            maxSteps: 10,
            experimental_transform: smoothStream({
              chunking: "word",
            }),
            tools: {
              getRevenue: getRevenueTool({ db, teamId, userId }),
            },
          });

          // Track response for metrics only
          let assistantResponse = "";
          result.textStream.pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                assistantResponse += chunk;
                controller.enqueue(chunk);
              },
              flush() {
                // Response complete - log completion metrics
                const responseTime = Date.now() - startTime;
                logger.info({
                  msg: "Chat response completed",
                  userId,
                  teamId,
                  responseTime,
                  responseLength: assistantResponse.length,
                });
              },
            }),
          );

          result.mergeIntoDataStream(dataStreamWriter);
        },
        onError: (error) => {
          logger.error({
            msg: "Chat streaming error",
            userId,
            teamId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          return error instanceof Error ? error.message : String(error);
        },
      });

      // Set headers for AI SDK data stream
      c.header("X-Vercel-AI-Data-Stream", "v1");
      c.header("Content-Type", "text/plain; charset=utf-8");
      c.header("Cache-Control", "no-cache");
      c.header("Connection", "keep-alive");

      // Stream the data stream response
      return stream(c, (stream) =>
        stream.pipe(dataStream.pipeThrough(new TextEncoderStream())),
      );
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
