import { z } from "@hono/zod-openapi";

// Define message parts schema to match AI SDK UIMessage structure
const messagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
    // Allow additional properties for extensibility
  })
  .passthrough();

// UIMessage schema that matches the exact structure from AI SDK
const messageSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the message",
      example: "msg_abc123",
    }),
    role: z.enum(["user", "assistant", "system"]).openapi({
      description: "The role of the message sender",
      example: "user",
    }),
    content: z.string().optional().openapi({
      description: "The message content (legacy field)",
      example: "Hello, can you help me with my finances?",
    }),
    parts: z.array(messagePartSchema).optional().openapi({
      description: "Message parts for complex messages",
    }),
    // Allow additional properties that might be added by AI SDK
  })
  .passthrough();

export const chatRequestSchema = z.object({
  id: z.string().openapi({
    description: "Chat ID",
    example: "chat_abc123",
  }),
  message: messageSchema.openapi({
    description: "The new message to send to the chat",
    example: {
      role: "user",
      content: "Hello, can you help me with my finances?",
    },
  }),
});

// Use the same structure as messageSchema for consistency with UIMessage
export const chatMessageSchema = messageSchema.extend({
  createdAt: z.string().datetime().optional().openapi({
    description: "ISO 8601 timestamp when the message was created",
    example: "2024-01-15T10:30:00.000Z",
  }),
});

export const chatResponseSchema = z.object({
  messages: z.array(messageSchema).openapi({
    description: "Array of UIMessage-compatible chat messages",
  }),
});

// tRPC-specific schemas
export const listChatsSchema = z.object({
  limit: z.number().min(1).max(100).default(50).openapi({
    description: "Maximum number of chats to return",
    example: 50,
  }),
});

export const getChatSchema = z.object({
  chatId: z.string().openapi({
    description: "Unique identifier of the chat",
    example: "chat_abc123",
  }),
});

export const updateChatTitleSchema = z.object({
  chatId: z.string().openapi({
    description: "Unique identifier of the chat",
    example: "chat_abc123",
  }),
  title: z.string().openapi({
    description: "New title for the chat",
    example: "Updated Financial Planning Discussion",
  }),
});

export const deleteChatSchema = z.object({
  chatId: z.string().openapi({
    description: "Unique identifier of the chat to delete",
    example: "chat_abc123",
  }),
});
