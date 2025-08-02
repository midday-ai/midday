import {
  createTransactionTagSchema,
  deleteTransactionTagSchema,
} from "@api/schemas/transaction-tags";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { createTransactionTag, deleteTransactionTag } from "@midday/db/queries";

export const transactionTagsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createTransactionTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createTransactionTag(db, {
        teamId: teamId!,
        transactionId: input.transactionId,
        tagId: input.tagId,
      });
    }),

  delete: protectedProcedure
    .input(deleteTransactionTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTransactionTag(db, {
        transactionId: input.transactionId,
        tagId: input.tagId,
        teamId: teamId!,
      });
    }),
});
