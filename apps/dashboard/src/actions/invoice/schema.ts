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
  logo_url: z.string().optional(),
  currency: z.string().optional(),
  payment_details: z.any(),
  from_details: z.any(),
});

export const createInvoiceSchema = z.object({
  template: updateInvoiceTemplateSchema,
  fromDetails: z.any(),
  customerDetails: z.any(),
  paymentDetails: z.any(),
  note: z.any().optional(),
  dueDate: z.coerce.date(),
  issueDate: z.coerce.date(),
  invoiceNumber: z.string(),
  logoUrl: z.string().optional(),
  vat: z.number().optional(),
  tax: z.number().optional(),
  amount: z.number(),
  lineItems: z
    .array(
      z
        .object({
          name: z.string().min(1, "Name is required"),
          quantity: z.number().min(0, "Quantity must be at least 0"),
          price: z.number().min(0, "Price must be at least 0"),
          vat: z.number().min(0, "VAT must be at least 0").optional(),
          tax: z.number().min(0, "Tax must be at least 0").optional(),
        })
        .refine((item) => item.quantity > 0 || item.price > 0, {
          message: "Either quantity or price must be greater than 0",
          path: ["quantity", "price"],
        }),
    )
    .min(1, "At least one line item is required")
    .refine(
      (items) => items.some((item) => item.quantity > 0 && item.price > 0),
      {
        message:
          "At least one line item must have both quantity and price greater than 0",
      },
    ),
});

export type InvoiceFormValues = z.infer<typeof createInvoiceSchema>;
export type InvoiceTemplate = z.infer<typeof createInvoiceSchema>["template"];
