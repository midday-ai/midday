import { z } from "@hono/zod-openapi";

// Define message parts schema for AI SDK compatibility - flexible to handle any part structure
const messagePartSchema = z.any();

const messageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(["user", "assistant", "system"]).openapi({
      description: "The role of the message sender",
      example: "user",
    }),
    content: z.string().optional().openapi({
      description: "The message content",
      example: "Hello, can you help me with my finances?",
    }),
    parts: z.array(messagePartSchema).optional().openapi({
      description: "Message parts for complex messages",
    }),
  })
  .transform((message) => {
    // Extract content from parts if content is missing
    let content = message.content;
    if (!content && message.parts && Array.isArray(message.parts)) {
      // Handle different AI SDK part structures
      for (const part of message.parts) {
        if (part && typeof part === "object") {
          // Try different possible text properties
          if (part.text && typeof part.text === "string") {
            content = (content || "") + part.text;
          } else if (part.content && typeof part.content === "string") {
            content = (content || "") + part.content;
          }
        }
      }
    }

    return {
      ...message,
      content,
    };
  });

export const chatRequestSchema = z.object({
  id: z.string().optional().openapi({
    description:
      "Chat ID for persistence. If not provided, a new chat will be created",
    example: "chat_abc123",
  }),
  message: messageSchema.openapi({
    description: "The last message to send to the AI assistant",
    example: {
      role: "user",
      content: "Hello, can you help me with my finances?",
    },
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
