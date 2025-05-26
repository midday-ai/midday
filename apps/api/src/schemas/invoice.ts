import { z } from "@hono/zod-openapi";

export const upsertInvoiceTemplateSchema = z.object({
  customerLabel: z.string().optional(),
  title: z.string().optional(),
  fromLabel: z.string().optional(),
  invoiceNoLabel: z.string().optional(),
  issueDateLabel: z.string().optional(),
  dueDateLabel: z.string().optional(),
  descriptionLabel: z.string().optional(),
  priceLabel: z.string().optional(),
  quantityLabel: z.string().optional(),
  totalLabel: z.string().optional(),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  timezone: z.string().optional(),
  paymentLabel: z.string().optional(),
  noteLabel: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string().optional(),
  paymentDetails: z.string().optional().nullable(),
  fromDetails: z.string().optional().nullable(),
  dateFormat: z.string().optional(),
  includeVat: z.boolean().optional().optional(),
  includeTax: z.boolean().optional().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  size: z.enum(["a4", "letter"]).optional(),
  deliveryType: z.enum(["create", "create_and_send"]).optional(),
  locale: z.string().optional(),
});

export const draftLineItemSchema = z.object({
  name: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be at least 0").optional(),
  unit: z.string().optional().nullable(),
  price: z.number().safe().optional(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
});

export const draftInvoiceSchema = z.object({
  id: z.string().uuid(),
  template: upsertInvoiceTemplateSchema,
  fromDetails: z.string().nullable().optional(),
  customerDetails: z.string().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  customerName: z.string().nullable().optional(),
  paymentDetails: z.string().nullable().optional(),
  noteDetails: z.string().nullable().optional(),
  dueDate: z.string(),
  issueDate: z.string(),
  invoiceNumber: z.string(),
  logoUrl: z.string().optional().nullable(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  amount: z.number().nullable().optional(),
  lineItems: z.array(draftLineItemSchema).optional(),
  token: z.string().optional(),
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  price: z.number(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
});

export const invoiceTemplateSchema = z.object({
  title: z.string().optional(),
  customerLabel: z.string(),
  fromLabel: z.string(),
  invoiceNoLabel: z.string(),
  issueDateLabel: z.string(),
  dueDateLabel: z.string(),
  descriptionLabel: z.string(),
  priceLabel: z.string(),
  quantityLabel: z.string(),
  totalLabel: z.string(),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  paymentLabel: z.string(),
  noteLabel: z.string(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string(),
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  size: z.enum(["a4", "letter"]),
  includeVat: z.boolean().optional(),
  includeTax: z.boolean().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]),
  deliveryType: z.enum(["create", "create_and_send"]),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const getInvoicesSchema = z
  .object({
    cursor: z.string().nullable().optional(),
    sort: z.array(z.string(), z.string()).nullable().optional(),
    pageSize: z.number().min(1).max(100).optional(),
    filter: z
      .object({
        q: z.string().nullable().optional(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        statuses: z.array(z.string()).nullable().optional(),
        customers: z.array(z.string()).nullable().optional(),
      })
      .optional(),
  })
  .optional();

export const getInvoiceByIdSchema = z.object({
  id: z.string(),
});

export const searchInvoiceNumberSchema = z.object({
  query: z.string(),
});

export const invoiceSummarySchema = z
  .object({
    status: z
      .enum(["draft", "overdue", "paid", "unpaid", "canceled"])
      .optional(),
  })
  .optional();

export const updateInvoiceSchema = z.object({
  id: z.string(),
  status: z.enum(["paid", "canceled", "unpaid"]).optional(),
  paidAt: z.string().nullable().optional(),
  internalNote: z.string().nullable().optional(),
});

export const deleteInvoiceSchema = z.object({
  id: z.string(),
});

export const createInvoiceSchema = z.object({
  id: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send"]),
});

export const remindInvoiceSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
});

export const duplicateInvoiceSchema = z.object({
  id: z.string().uuid(),
});

export const getInvoiceByTokenSchema = z.object({
  token: z.string(),
});
