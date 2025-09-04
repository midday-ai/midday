import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createChat,
  deleteChat,
  getChatWithMessages,
  getChatsByTeam,
  updateChatTitle,
} from "@midday/db/queries";
import { z } from "zod";

export const chatsRouter = createTRPCRouter({
  // Get all chats for a team
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getChatsByTeam(ctx.db, ctx.teamId!, input.limit);
    }),

  // Get a specific chat with messages
  get: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getChatWithMessages(ctx.db, input.chatId, ctx.teamId!);
    }),

  create: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await createChat(ctx.db, {
        id: input.chatId,
        teamId: ctx.teamId!,
        userId: ctx.session.user.id,
        title: input.title,
      });
    }),

  updateTitle: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await updateChatTitle(ctx.db, input.chatId, input.title);
    }),

  // Delete a chat
  delete: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await deleteChat(ctx.db, input.chatId, ctx.teamId!);
      return { success: true };
    }),
});
