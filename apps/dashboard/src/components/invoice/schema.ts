import { updateInvoiceSettingsSchema } from "@/actions/invoice/schema";
import { z } from "zod";

export const invoiceSchema = z.object({
  settings: updateInvoiceSettingsSchema,
  fromDetails: z.any(),
  customerDetails: z.any(),
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
export type InvoiceSettings = z.infer<typeof invoiceSchema>["settings"];
