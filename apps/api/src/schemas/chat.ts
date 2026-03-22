import type { UIChatMessage } from "@api/ai/types";
import { z } from "@hono/zod-openapi";
import { isValidTimezone } from "@midday/location/timezones";

// Create a Zod schema that validates UIChatMessage structure
const messageSchema = z
  .custom<UIChatMessage>((val) => {
    if (typeof val !== "object" || val === null) return false;

    const msg = val as any;

    // Check required fields
    if (typeof msg.id !== "string") return false;
    if (!["user", "assistant", "system"].includes(msg.role)) return false;

    // Must have either content or parts
    const hasContent =
      msg.content !== undefined && typeof msg.content === "string";
    const hasParts = msg.parts !== undefined && Array.isArray(msg.parts);

    if (!hasContent && !hasParts) return false;

    // If parts exist, validate structure
    if (hasParts) {
      for (const part of msg.parts) {
        if (typeof part !== "object" || part === null) return false;
        if (typeof part.type !== "string") return false;
        // Allow various part types with different structures
      }
    }

    return true;
  })
  .openapi({
    description:
      "UIMessage compatible chat message with tools and metadata support",
    example: {
      id: "msg_abc123",
      role: "user",
      content: "Hello, can you help me with my finances?",
    },
  });

export const chatRequestSchema = z.object({
  id: z.string().openapi({
    description: "Chat ID",
    example: "chat_abc123",
  }),
  messages: z.array(messageSchema).openapi({
    description: "The full conversation messages to send to the chat",
  }),
  country: z.string().optional().openapi({
    description: "User's country",
    example: "United States",
  }),
  city: z.string().optional().openapi({
    description: "User's city",
    example: "San Francisco",
  }),
  timezone: z
    .string()
    .refine(isValidTimezone, {
      message:
        "Invalid timezone. Use IANA timezone format (e.g., 'America/New_York', 'UTC')",
    })
    .optional()
    .openapi({
      description: "User's timezone",
      example: "America/New_York",
    }),
  invoiceId: z.string().optional().openapi({
    description:
      "ID of the invoice currently open in the canvas, if any. Passed so AI tools can modify the active draft.",
    example: "inv_abc123",
  }),
});

// Use the same structure as messageSchema for consistency with UIMessage
export const chatMessageSchema = messageSchema;

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
  search: z.string().optional().openapi({
    description: "Search query to filter chats by title",
    example: "budget analysis",
  }),
});

export const getChatSchema = z.object({
  chatId: z.string().openapi({
    description: "Unique identifier of the chat",
    example: "chat_abc123",
  }),
});

export const deleteChatSchema = z.object({
  chatId: z.string().openapi({
    description: "Unique identifier of the chat to delete",
    example: "chat_abc123",
  }),
});
