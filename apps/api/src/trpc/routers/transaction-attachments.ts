import {
  createAttachmentsSchema,
  deleteAttachmentSchema,
  processTransactionAttachmentSchema,
} from "@api/schemas/transaction-attachments";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import type { ProcessTransactionAttachmentPayload } from "@jobs/schema";
import { createAttachments, deleteAttachment } from "@midday/db/queries";
import { allowedMimeTypes } from "@midday/documents/utils";
import { tasks } from "@trigger.dev/sdk";

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
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteAttachment(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  processAttachment: protectedProcedure
    .input(processTransactionAttachmentSchema)
    .mutation(async ({ input, ctx: { teamId } }) => {
      const allowedAttachments = input.filter((item) =>
        allowedMimeTypes.includes(item.mimetype),
      );

      if (allowedAttachments.length === 0) {
        return;
      }

      return tasks.batchTrigger(
        "process-transaction-attachment",
        allowedAttachments.map(
          (item) =>
            ({
              payload: {
                filePath: item.filePath,
                mimetype: item.mimetype,
                teamId: teamId!,
                transactionId: item.transactionId,
              },
            }) as { payload: ProcessTransactionAttachmentPayload },
        ),
      );
    }),
});
