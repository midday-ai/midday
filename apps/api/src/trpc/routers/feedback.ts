import {
  createChatFeedbackSchema,
  deleteChatFeedbackSchema,
} from "@api/schemas/feedback";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { chatFeedbackCache } from "@midday/cache/chat-feedback-cache";

export const chatFeedbackRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createChatFeedbackSchema)
    .mutation(async ({ input, ctx: { teamId, session } }) => {
      await chatFeedbackCache.set(
        input.chatId,
        input.messageId,
        session.user.id,
        {
          type: input.type,
          comment: input.comment,
          createdAt: new Date().toISOString(),
          teamId: teamId!,
        },
      );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(deleteChatFeedbackSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      await chatFeedbackCache.delete(
        input.chatId,
        input.messageId,
        session.user.id,
      );

      return { success: true };
    }),
});
