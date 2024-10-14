import { z } from "zod";

export const deleteInvoiceSchema = z.object({
  id: z.string(),
});

export const updateInvoiceSettingsSchema = z.object({
  customerLabel: z.string().optional(),
  fromLabel: z.string().optional(),
  invoiceNoLabel: z.string().optional(),
  issueDateLabel: z.string().optional(),
  dueDateLabel: z.string().optional(),
  descriptionLabel: z.string().optional(),
  priceLabel: z.string().optional(),
  quantityLabel: z.string().optional(),
  totalLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  paymentDetailsLabel: z.string().optional(),
  noteLabel: z.string().optional(),
  logoUrl: z.string().optional(),
});
