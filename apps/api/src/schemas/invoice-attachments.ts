import { z } from "@hono/zod-openapi";

export const createInvoiceAttachmentsSchema = z.array(
  z.object({
    path: z.array(z.string()),
    name: z.string(),
    size: z.number(),
    invoiceId: z.string().uuid(),
  }),
);

export const deleteInvoiceAttachmentSchema = z.object({
  id: z.string().uuid(),
});

export const getInvoiceAttachmentsSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const getInvoiceAttachmentsByTokenSchema = z.object({
  token: z.string(),
});
