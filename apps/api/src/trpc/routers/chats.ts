import { memoryProvider } from "@api/ai/agents/config/shared";
import {
  deleteChatSchema,
  getChatSchema,
  listChatsSchema,
} from "@api/schemas/chat";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { TRPCError } from "@trpc/server";

export const chatsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listChatsSchema)
    .query(async ({ ctx, input }) => {
      const scopedUserId = `${ctx.session.user.id}:${ctx.teamId}`;

      return memoryProvider.getChats({
        userId: scopedUserId,
        search: input.search,
        limit: input.limit ?? 50,
      });
    }),

  get: protectedProcedure.input(getChatSchema).query(async ({ ctx, input }) => {
    const scopedUserId = `${ctx.session.user.id}:${ctx.teamId}`;

    return memoryProvider.getMessages({
      chatId: input.chatId,
      userId: scopedUserId,
      limit: 50,
    });
  }),

  delete: protectedProcedure
    .input(deleteChatSchema)
    .mutation(async ({ ctx, input }) => {
      const scopedUserId = `${ctx.session.user.id}:${ctx.teamId}`;

      // Verify ownership first since deleteChat may not support userId parameter
      // Try to get messages with userId to verify ownership
      try {
        await memoryProvider.getMessages({
          chatId: input.chatId,
          userId: scopedUserId,
          limit: 1,
        });
      } catch (_error) {
        // If getMessages fails, the chat doesn't belong to the user
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this chat",
        });
      }

      // If getMessages succeeds, the chat belongs to the user, so we can delete it
      return memoryProvider.deleteChat(input.chatId);
    }),
});
