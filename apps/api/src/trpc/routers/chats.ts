import {
  deleteChatSchema,
  getChatSchema,
  listChatsSchema,
} from "@api/schemas/chat";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { deleteChat, getChatById, getChatsByTeam } from "@midday/db/queries";
import { TRPCError } from "@trpc/server";

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
    const chat = await getChatById(ctx.db, input.chatId, ctx.teamId!);

    if (!chat) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return chat;
  }),

  delete: protectedProcedure
    .input(deleteChatSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteChat(ctx.db, input.chatId, ctx.teamId!);
    }),
});
