import { z } from "@hono/zod-openapi";

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]).openapi({
          description: "The role of the message sender",
          example: "user",
        }),
        content: z.string().openapi({
          description: "The message content",
          example: "Hello, can you help me with my finances?",
        }),
      }),
    )
    .openapi({
      description: "Array of chat messages",
    }),
  stream: z.boolean().optional().default(true).openapi({
    description: "Whether to stream the response",
    example: true,
  }),
});

export const chatMessageSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier for the message",
    example: "msg_abc123",
  }),
  role: z.enum(["user", "assistant", "system"]).openapi({
    description: "The role of the message sender",
    example: "assistant",
  }),
  content: z.string().openapi({
    description: "The message content",
    example:
      "I'd be happy to help you with your finances! What specific area would you like assistance with?",
  }),
  createdAt: z.string().datetime().openapi({
    description: "ISO 8601 timestamp when the message was created",
    example: "2024-01-15T10:30:00.000Z",
  }),
});

export const chatResponseSchema = z.object({
  messages: z.array(chatMessageSchema).openapi({
    description: "Array of chat messages including the new assistant response",
  }),
});
