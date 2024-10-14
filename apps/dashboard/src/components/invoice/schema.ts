import { z } from "zod";

export const invoiceSchema = z.object({
  settings: z.object({
    customerContent: z.string(),
    fromContent: z.string(),
    invoiceNo: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    description: z.string(),
    price: z.string(),
    quantity: z.string(),
    total: z.string(),
    vat: z.string(),
    tax: z.string(),
    paymentDetails: z.string(),
    note: z.string(),
    logoUrl: z.string().optional(),
  }),
  from: z.any(),
  customer: z.any(),
  paymentDetails: z.any(),
  note: z.any().optional(),
  dueDate: z.date(),
  issueDate: z.date(),
  invoiceNumber: z.string(),
  logoUrl: z.string().optional(),
  vat: z.number().optional(),
  tax: z.number().optional(),
  amount: z.number(),
  currency: z.string(),
  lineItems: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
      vat: z.number().optional(),
      tax: z.number().optional(),
    }),
  ),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
