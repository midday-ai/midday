import {
  createAttachments,
  deleteAttachment,
} from "@api/db/queries/transaction-attachments";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { createAttachmentsSchema, deleteAttachmentSchema } from "./schema";

export const transactionAttachmentsRouter = createTRPCRouter({
  createMany: protectedProcedure
    .input(createAttachmentsSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return createAttachments(db, {
        teamId: teamId!,
        attachments: input,
      });
    }),

  delete: protectedProcedure
    .input(deleteAttachmentSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      return deleteAttachment(db, input.id);
    }),
});
