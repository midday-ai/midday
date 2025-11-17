import { z } from "@hono/zod-openapi";

export const createChatFeedbackSchema = z.object({
  chatId: z.string().openapi({
    description: "Chat ID",
    example: "chat_abc123",
  }),
  messageId: z.string().openapi({
    description: "Message ID from AI SDK",
    example: "msg_abc123",
  }),
  type: z.enum(["positive", "negative", "other"]).openapi({
    description: "Type of feedback",
    example: "positive",
  }),
  comment: z.string().optional().openapi({
    description: "Optional comment",
    example: "This response was very helpful!",
  }),
});

export const deleteChatFeedbackSchema = z.object({
  chatId: z.string().openapi({
    description: "Chat ID",
    example: "chat_abc123",
  }),
  messageId: z.string().openapi({
    description: "Message ID from AI SDK",
    example: "msg_abc123",
  }),
});
