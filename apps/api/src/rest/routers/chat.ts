import { openai } from "@ai-sdk/openai";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { getTeamById, getUserById } from "@db/queries";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { streamText } from "ai";
import { createDataStream } from "ai";
import { stream } from "hono/streaming";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.post(
  "/",
  withRequiredScope("chat.write"),
  zValidator("json", chatRequestSchema),
  async (c) => {
    const db = c.get("db");
    const { messages } = c.req.valid("json");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const userId = session.user.id;

    const team = await getTeamById(db, teamId);
    const user = await getUserById(db, userId);

    try {
      const dataStream = createDataStream({
        execute: async (dataStreamWriter) => {
          const result = streamText({
            model: openai("gpt-5-nano"),
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            system: `You are a helpful AI assistant for Midday, a financial management platform. 
            You help users with:
            - Financial insights and analysis
            - Invoice management
            - Transaction categorization
            - Time tracking
            - Business reporting
            - General financial advice

            Be helpful, professional, and concise in your responses.

            Current team name: ${team?.name}
            Current user name: ${user?.fullName}
            Current date: ${new Date().toISOString().split("T")[0]}
            Company country code: ${team?.countryCode}
            Company currency: ${team?.baseCurrency}
            `,
            temperature: 0.7,
            maxTokens: 1000,
          });

          result.mergeIntoDataStream(dataStreamWriter);
        },
        onError: (error) => {
          console.error("Chat streaming error:", error);
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
      console.error("Chat error:", error);
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
