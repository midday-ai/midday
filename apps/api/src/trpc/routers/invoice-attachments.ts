import {
  createInvoiceAttachmentsSchema,
  deleteInvoiceAttachmentSchema,
  getInvoiceAttachmentsSchema,
  getInvoiceAttachmentsByTokenSchema,
} from "@api/schemas/invoice-attachments";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import {
  createInvoiceAttachments,
  deleteInvoiceAttachment,
  getInvoiceAttachments,
  getInvoiceAttachmentsByInvoiceId,
  getInvoiceById,
} from "@midday/db/queries";
import { verify } from "@midday/invoice/token";
import { remove } from "@midday/supabase/storage";
import { TRPCError } from "@trpc/server";

export const invoiceAttachmentsRouter = createTRPCRouter({
  createMany: protectedProcedure
    .input(createInvoiceAttachmentsSchema)
    .mutation(async ({ input, ctx: { db, supabase, teamId } }) => {
      // Validate that all attachments are PDFs
      for (const attachment of input) {
        if (!attachment.name.toLowerCase().endsWith(".pdf")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only PDF files are allowed as invoice attachments",
          });
        }
      }

      return createInvoiceAttachments(db, {
        teamId: teamId!,
        attachments: input,
      });
    }),

  delete: protectedProcedure
    .input(deleteInvoiceAttachmentSchema)
    .mutation(async ({ input, ctx: { db, supabase, teamId } }) => {
      const result = await deleteInvoiceAttachment(db, {
        id: input.id,
        teamId: teamId!,
      });

      // Delete the file from storage
      if (result?.path && result.path.length > 0) {
        try {
          await remove(supabase, {
            bucket: "vault",
            path: result.path,
          });
        } catch (error) {
          // Log error but don't fail the deletion if file doesn't exist in storage
          console.error(
            `Failed to delete file from storage for ${result.id}:`,
            error,
          );
        }
      }

      return result;
    }),

  getByInvoiceId: protectedProcedure
    .input(getInvoiceAttachmentsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoiceAttachments(db, {
        invoiceId: input.invoiceId,
        teamId: teamId!,
      });
    }),

  // Public endpoint for accessing attachments via invoice token
  getByToken: publicProcedure
    .input(getInvoiceAttachmentsByTokenSchema)
    .query(async ({ input, ctx: { db } }) => {
      // Verify the token and extract the invoice ID
      const { id: invoiceId } = (await verify(
        decodeURIComponent(input.token),
      )) as {
        id: string;
      };

      if (!invoiceId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Get the invoice to verify it exists
      const invoice = await getInvoiceById(db, { id: invoiceId });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      return getInvoiceAttachmentsByInvoiceId(db, {
        invoiceId,
      });
    }),
});
