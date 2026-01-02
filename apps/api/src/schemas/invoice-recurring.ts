import { z } from "@hono/zod-openapi";
import {
  draftLineItemSchema,
  editorFieldSchema,
  upsertInvoiceTemplateSchema,
} from "./invoice";

// Frequency enum schema
export const invoiceRecurringFrequencySchema = z.enum([
  "weekly",
  "monthly_date",
  "monthly_weekday",
  "custom",
]);

// End type enum schema
export const invoiceRecurringEndTypeSchema = z.enum([
  "never",
  "on_date",
  "after_count",
]);

// Status enum schema
export const invoiceRecurringStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
]);

// Base recurring invoice schema for tRPC
export const createInvoiceRecurringSchema = z.object({
  customerId: z.string().uuid().nullable().optional().openapi({
    description: "Customer ID for the recurring invoice series",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  customerName: z.string().nullable().optional().openapi({
    description: "Customer name for display",
    example: "Acme Corporation",
  }),
  // Frequency settings
  frequency: invoiceRecurringFrequencySchema.openapi({
    description:
      "How often invoices should be generated: 'weekly' - every week on a specific day, 'monthly_date' - monthly on a specific date (e.g., 15th), 'monthly_weekday' - monthly on a specific weekday occurrence (e.g., 1st Friday), 'custom' - every X days",
    example: "monthly_date",
  }),
  frequencyDay: z.number().int().min(0).max(31).nullable().optional().openapi({
    description:
      "For 'weekly': day of week (0=Sunday, 6=Saturday). For 'monthly_date': day of month (1-31)",
    example: 15,
  }),
  frequencyWeek: z.number().int().min(1).max(5).nullable().optional().openapi({
    description:
      "For 'monthly_weekday': which occurrence of the weekday (1=first, 2=second, etc.)",
    example: 1,
  }),
  frequencyInterval: z.number().int().min(1).nullable().optional().openapi({
    description: "For 'custom': number of days between invoices",
    example: 14,
  }),
  // End conditions
  endType: invoiceRecurringEndTypeSchema.openapi({
    description:
      "When the series should end: 'never' - continues indefinitely, 'on_date' - ends on a specific date, 'after_count' - ends after a specific number of invoices",
    example: "after_count",
  }),
  endDate: z.string().datetime().nullable().optional().openapi({
    description: "End date for the series (required if endType is 'on_date')",
    example: "2025-12-31T23:59:59.000Z",
  }),
  endCount: z.number().int().min(1).nullable().optional().openapi({
    description:
      "Number of invoices to generate (required if endType is 'after_count')",
    example: 12,
  }),
  // Timezone
  timezone: z.string().openapi({
    description:
      "Timezone for scheduling (e.g., 'America/New_York'). Used to determine correct day-of-week for weekly invoices",
    example: "America/New_York",
  }),
  // Payment terms
  dueDateOffset: z.number().int().min(0).default(30).openapi({
    description: "Days from issue date to due date",
    example: 30,
  }),
  // Invoice template data
  amount: z.number().nullable().optional().openapi({
    description: "Total amount for each invoice",
    example: 1500.0,
  }),
  currency: z.string().nullable().optional().openapi({
    description: "Currency code (ISO 4217)",
    example: "USD",
  }),
  lineItems: z.array(draftLineItemSchema).nullable().optional().openapi({
    description: "Line items for the invoice",
  }),
  template: upsertInvoiceTemplateSchema.nullable().optional().openapi({
    description: "Invoice template settings",
  }),
  paymentDetails: z.any().nullable().optional().openapi({
    description: "Payment details in TipTap JSONContent format",
  }),
  fromDetails: z.any().nullable().optional().openapi({
    description: "Sender details in TipTap JSONContent format",
  }),
  noteDetails: z.any().nullable().optional().openapi({
    description: "Note details in TipTap JSONContent format",
  }),
  vat: z.number().nullable().optional().openapi({
    description: "VAT amount",
    example: 150.0,
  }),
  tax: z.number().nullable().optional().openapi({
    description: "Tax amount",
    example: 50.0,
  }),
  discount: z.number().nullable().optional().openapi({
    description: "Discount amount",
    example: 100.0,
  }),
  subtotal: z.number().nullable().optional().openapi({
    description: "Subtotal before taxes and discounts",
    example: 1400.0,
  }),
  topBlock: z.any().nullable().optional().openapi({
    description: "Custom content block for top of invoice",
  }),
  bottomBlock: z.any().nullable().optional().openapi({
    description: "Custom content block for bottom of invoice",
  }),
  templateId: z.string().uuid().nullable().optional().openapi({
    description: "Reference to invoice template",
    example: "c4d5e6f7-8901-2345-6789-abcdef012345",
  }),
});

// Update schema - extends create with id and allows partial updates
export const updateInvoiceRecurringSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring invoice series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
  customerId: z.string().uuid().nullable().optional(),
  customerName: z.string().nullable().optional(),
  frequency: invoiceRecurringFrequencySchema.optional(),
  frequencyDay: z.number().int().min(0).max(31).nullable().optional(),
  frequencyWeek: z.number().int().min(1).max(5).nullable().optional(),
  frequencyInterval: z.number().int().min(1).nullable().optional(),
  endType: invoiceRecurringEndTypeSchema.optional(),
  endDate: z.string().datetime().nullable().optional(),
  endCount: z.number().int().min(1).nullable().optional(),
  timezone: z.string().optional(),
  dueDateOffset: z.number().int().min(0).optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  lineItems: z.array(draftLineItemSchema).nullable().optional(),
  template: upsertInvoiceTemplateSchema.nullable().optional(),
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  noteDetails: z.any().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  templateId: z.string().uuid().nullable().optional(),
  status: invoiceRecurringStatusSchema.optional(),
});

// Get by ID schema
export const getInvoiceRecurringByIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring invoice series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
});

// List schema
export const getInvoiceRecurringListSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: "Cursor for pagination",
      param: { in: "query" },
    }),
  pageSize: z.coerce
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(25)
    .openapi({
      description: "Number of items per page (1-100)",
      param: { in: "query" },
    }),
  status: z
    .array(invoiceRecurringStatusSchema)
    .nullable()
    .optional()
    .openapi({
      description: "Filter by status",
      param: { in: "query" },
    }),
  customerId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .openapi({
      description: "Filter by customer ID",
      param: { in: "query" },
    }),
});

// Pause/Resume schema
export const pauseResumeInvoiceRecurringSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring invoice series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
});

// Get upcoming invoices schema
export const getUpcomingInvoicesSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier for the recurring invoice series",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
  limit: z.coerce
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .openapi({
      description: "Maximum number of upcoming invoices to preview",
      param: { in: "query" },
    }),
});

// Delete schema
export const deleteInvoiceRecurringSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description:
        "Unique identifier for the recurring invoice series to delete",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      param: { in: "path", name: "id" },
    }),
});

// Response schemas
export const upcomingInvoiceSchema = z.object({
  date: z.string().openapi({
    description: "Scheduled date for the invoice (ISO 8601)",
    example: "2026-02-01T00:00:00.000Z",
  }),
  amount: z.number().openapi({
    description: "Invoice amount",
    example: 1500.0,
  }),
});

export const upcomingSummarySchema = z.object({
  hasEndDate: z.boolean().openapi({
    description: "Whether the series has an end date or count",
    example: true,
  }),
  totalCount: z.number().nullable().openapi({
    description: "Total number of invoices in the series (null if no end)",
    example: 12,
  }),
  totalAmount: z.number().nullable().openapi({
    description: "Total amount of all invoices (null if no end)",
    example: 18000.0,
  }),
  currency: z.string().openapi({
    description: "Currency code",
    example: "USD",
  }),
});

export const getUpcomingInvoicesResponseSchema = z.object({
  invoices: z.array(upcomingInvoiceSchema).openapi({
    description: "List of upcoming scheduled invoices",
  }),
  summary: upcomingSummarySchema.openapi({
    description: "Summary of the recurring series",
  }),
});

export const invoiceRecurringResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the recurring invoice series",
    example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
  }),
  createdAt: z.string().openapi({
    description: "When the series was created (ISO 8601)",
    example: "2024-06-01T00:00:00.000Z",
  }),
  updatedAt: z.string().nullable().openapi({
    description: "When the series was last updated (ISO 8601)",
    example: "2024-06-15T00:00:00.000Z",
  }),
  status: invoiceRecurringStatusSchema.openapi({
    description: "Current status of the recurring series",
    example: "active",
  }),
  frequency: invoiceRecurringFrequencySchema.openapi({
    description: "Frequency of invoice generation",
    example: "monthly_date",
  }),
  frequencyDay: z.number().nullable().openapi({
    description: "Day parameter for frequency",
    example: 15,
  }),
  frequencyWeek: z.number().nullable().openapi({
    description: "Week parameter for monthly_weekday frequency",
    example: null,
  }),
  frequencyInterval: z.number().nullable().openapi({
    description: "Interval for custom frequency",
    example: null,
  }),
  endType: invoiceRecurringEndTypeSchema.openapi({
    description: "How the series ends",
    example: "after_count",
  }),
  endDate: z.string().nullable().openapi({
    description: "End date (if endType is 'on_date')",
    example: null,
  }),
  endCount: z.number().nullable().openapi({
    description: "End count (if endType is 'after_count')",
    example: 12,
  }),
  invoicesGenerated: z.number().openapi({
    description: "Number of invoices generated so far",
    example: 3,
  }),
  nextScheduledAt: z.string().nullable().openapi({
    description: "Next scheduled generation date (ISO 8601)",
    example: "2026-02-15T00:00:00.000Z",
  }),
  lastGeneratedAt: z.string().nullable().openapi({
    description: "When the last invoice was generated (ISO 8601)",
    example: "2026-01-15T00:00:00.000Z",
  }),
  amount: z.number().nullable().openapi({
    description: "Invoice amount",
    example: 1500.0,
  }),
  currency: z.string().nullable().openapi({
    description: "Currency code",
    example: "USD",
  }),
  customerId: z.string().uuid().nullable().openapi({
    description: "Customer ID",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  customerName: z.string().nullable().openapi({
    description: "Customer name",
    example: "Acme Corporation",
  }),
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().nullable(),
      website: z.string().nullable().optional(),
    })
    .nullable()
    .openapi({
      description: "Customer details",
    }),
});

export const invoiceRecurringListResponseSchema = z.object({
  meta: z.object({
    cursor: z.string().nullable().openapi({
      description: "Cursor for next page, null if no more pages",
      example: "25",
    }),
    hasPreviousPage: z.boolean().openapi({
      description: "Whether there is a previous page",
      example: false,
    }),
    hasNextPage: z.boolean().openapi({
      description: "Whether there is a next page",
      example: true,
    }),
  }),
  data: z.array(invoiceRecurringResponseSchema).openapi({
    description: "List of recurring invoice series",
  }),
});

// Invoice recurring info for displaying on an invoice
export const invoiceRecurringInfoSchema = z.object({
  recurringId: z.string().uuid().openapi({
    description: "ID of the recurring invoice series",
    example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
  }),
  sequence: z.number().nullable().openapi({
    description:
      "Sequence number of this invoice in the series (e.g., 3 for 3rd invoice)",
    example: 3,
  }),
  totalCount: z.number().nullable().openapi({
    description: "Total count if series has a limit (null if no end)",
    example: 12,
  }),
  frequency: invoiceRecurringFrequencySchema.openapi({
    description: "Frequency of the series",
    example: "monthly_date",
  }),
  frequencyDay: z.number().nullable().openapi({
    description: "Day parameter for frequency",
    example: 15,
  }),
  frequencyWeek: z.number().nullable().openapi({
    description: "Week parameter for monthly_weekday frequency",
    example: null,
  }),
  nextScheduledAt: z.string().nullable().openapi({
    description: "Next scheduled invoice date",
    example: "2026-02-15T00:00:00.000Z",
  }),
  status: invoiceRecurringStatusSchema.openapi({
    description: "Status of the recurring series",
    example: "active",
  }),
});
