import { z } from "zod";

export const deleteInvoiceSchema = z.object({
  id: z.string(),
});

export const updateInvoiceTemplateSchema = z.object({
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
  logo_url: z.string().optional().nullable(),
  currency: z.string().optional(),
  payment_details: z.any().nullable(),
  from_details: z.any().nullable(),
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  price: z.number().min(0, "Price must be at least 0"),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
});

export const upsertInvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  template: updateInvoiceTemplateSchema,
  fromDetails: z.any(),
  customerDetails: z.any(),
  customer_id: z.string().uuid().optional(),
  paymentDetails: z.any(),
  note: z.any().optional(),
  dueDate: z.coerce.date(),
  issueDate: z.coerce.date(),
  invoiceNumber: z.string(),
  logoUrl: z.string().optional(),
  vat: z.number().optional(),
  tax: z.number().optional(),
  amount: z.number(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

export const invoiceTemplateSchema = z.object({
  customer_label: z.string(),
  from_label: z.string(),
  invoice_no_label: z.string(),
  issue_date_label: z.string(),
  due_date_label: z.string(),
  description_label: z.string(),
  price_label: z.string(),
  quantity_label: z.string(),
  total_label: z.string(),
  vat_label: z.string().optional(),
  tax_label: z.string().optional(),
  payment_details_label: z.string(),
  note_label: z.string(),
  logo_url: z.string().optional(),
  currency: z.string(),
  payment_details: z.any(),
  from_details: z.any(),
});

export const invoiceFormSchema = z.object({
  id: z.string().uuid(),
  template: invoiceTemplateSchema,
  fromDetails: z.any(),
  customerDetails: z.any(),
  customer_id: z.string().uuid(),
  paymentDetails: z.any(),
  note: z.any().optional(),
  dueDate: z.coerce.date(),
  issueDate: z.coerce.date(),
  invoiceNumber: z.string(),
  logoUrl: z.string().optional(),
  vat: z.number().optional(),
  tax: z.number().optional(),
  amount: z.number(),
  lineItems: z.array(lineItemSchema).min(1),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceTemplate = z.infer<typeof updateInvoiceTemplateSchema>;
