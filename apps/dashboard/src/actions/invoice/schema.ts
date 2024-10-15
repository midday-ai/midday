import { z } from "zod";

export const deleteInvoiceSchema = z.object({
  id: z.string(),
});

export const updateInvoiceSettingsSchema = z.object({
  customer_label: z.string().optional(),
  from_label: z.string().optional(),
  invoice_no_label: z.string().optional(),
  issue_date_label: z.string().optional(),
  due_date_label: z.string().optional(),
  description_label: z.string().optional(),
  price_label: z.string().optional(),
  quantity_label: z.string().optional(),
  total_label: z.string().optional(),
  vat_label: z.string().optional(),
  tax_label: z.string().optional(),
  payment_details_label: z.string().optional(),
  note_label: z.string().optional(),
  logo_url: z.string().optional(),
});
