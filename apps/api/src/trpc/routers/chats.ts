import {
  deleteChatSchema,
  getChatSchema,
  listChatsSchema,
  updateChatTitleSchema,
} from "@api/schemas/chat";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteChat,
  getChatById,
  getChatsByTeam,
  updateChatTitle,
} from "@midday/db/queries";

export const chatsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listChatsSchema)
    .query(async ({ ctx, input }) => {
      return getChatsByTeam(
        ctx.db,
        ctx.teamId!,
        ctx.session.user.id,
        input.limit,
      );
    }),

  get: protectedProcedure.input(getChatSchema).query(async ({ ctx, input }) => {
    return getChatById(ctx.db, input.chatId, ctx.teamId!);
  }),

  updateTitle: protectedProcedure
    .input(updateChatTitleSchema)
    .mutation(async ({ ctx, input }) => {
      return updateChatTitle(ctx.db, input.chatId, input.title, ctx.teamId!);
    }),

  delete: protectedProcedure
    .input(deleteChatSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteChat(ctx.db, input.chatId, ctx.teamId!);
    }),
});
