import { memoryProvider } from "@api/ai/agents/config/shared";
import {
  deleteChatSchema,
  getChatSchema,
  listChatsSchema,
} from "@api/schemas/chat";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

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
    return memoryProvider.getMessages({
      chatId: input.chatId,
      limit: 50,
    });
  }),

  delete: protectedProcedure
    .input(deleteChatSchema)
    .mutation(async ({ input }) => {
      return memoryProvider.deleteChat(input.chatId);
    }),
});
