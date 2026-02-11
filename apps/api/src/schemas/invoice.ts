import { z } from "@hono/zod-openapi";
import { isValidTimezone } from "@midday/location/timezones";

// TipTap JSONContent schema for editor fields
export const tiptapContentSchema: z.ZodType<any> = z
  .object({
    type: z.string().optional(),
    attrs: z.record(z.any(), z.any()).optional(),
    content: z.array(z.any()).optional(),
    marks: z
      .array(
        z.object({
          type: z.enum(["bold", "italic", "strike", "link", "underline"]),
          attrs: z.record(z.any(), z.any()).optional(),
        }),
      )
      .optional(),
    text: z.string().optional(),
  })
  .openapi({
    description: "TipTap editor JSON content structure",
    type: "object",
    example: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Acme Inc",
              marks: [{ type: "bold" }],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "123 Main St, City, Country",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Visit our website: ",
            },
            {
              type: "text",
              text: "https://acme.com",
              marks: [
                {
                  type: "link",
                  attrs: { href: "https://acme.com" },
                },
              ],
            },
          ],
        },
      ],
    },
  });

// Schema for editor fields that must be TipTap JSONContent
export const editorFieldSchema = tiptapContentSchema
  .nullable()
  .optional()
  .openapi({
    description: "Editor field in TipTap JSONContent format",
  });

// Base template schema with common fields
const baseInvoiceTemplateSchema = z.object({
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
  timezone: z
    .string()
    .refine(isValidTimezone, {
      message:
        "Invalid timezone. Use IANA timezone format (e.g., 'America/New_York', 'UTC')",
    })
    .optional(),
  paymentLabel: z.string().optional(),
  noteLabel: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  includeVat: z.boolean().optional(),
  includeTax: z.boolean().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  sendCopy: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  includeLineItemTax: z.boolean().optional(),
  lineItemTaxLabel: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  vatRate: z.number().min(0).max(100).optional().nullable(),
  size: z.enum(["a4", "letter"]).optional(),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]).optional(),
  locale: z.string().optional(),
  paymentEnabled: z.boolean().optional(),
  paymentTermsDays: z.number().min(0).max(365).optional(),
  emailSubject: z.string().optional().nullable(),
  emailHeading: z.string().optional().nullable(),
  emailBody: z.string().optional().nullable(),
  emailButtonText: z.string().optional().nullable(),
});

// tRPC-compatible template schema (uses z.any() for editor fields)
export const upsertInvoiceTemplateSchema = baseInvoiceTemplateSchema.extend({
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  noteDetails: z.any().nullable().optional(),
});

// Template schema with TipTap validation for editor fields
export const restUpsertInvoiceTemplateSchema = baseInvoiceTemplateSchema.extend(
  {
    paymentDetails: editorFieldSchema.openapi({
      description: "Payment details in TipTap JSONContent format",
    }),
    fromDetails: editorFieldSchema.openapi({
      description: "Sender details in TipTap JSONContent format",
    }),
    noteDetails: editorFieldSchema.openapi({
      description:
        "Default footer notes in TipTap JSONContent format for new invoices",
    }),
  },
);

// Base line item schema with common fields
const baseDraftLineItemSchema = z.object({
  quantity: z.number().min(0, "Quantity must be at least 0").optional(),
  unit: z.string().optional().nullable(),
  price: z.number().optional(),
  vat: z.number().min(0, "VAT must be at least 0").nullable().optional(),
  tax: z.number().min(0, "Tax must be at least 0").nullable().optional(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
});

// tRPC-compatible line item schema (uses string for name field)
export const draftLineItemSchema = baseDraftLineItemSchema.extend({
  name: z.string().nullable().optional(),
  productId: z.string().uuid().optional(),
});

// Line item schema with TipTap validation for name field
export const restDraftLineItemSchema = baseDraftLineItemSchema.extend({
  name: editorFieldSchema.openapi({
    description: "Line item description in TipTap JSONContent format",
    example: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Web Development Services",
            },
          ],
        },
      ],
    },
  }),
  productId: z.string().uuid().optional().openapi({
    description: "Optional reference to a saved product",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
});

// Base draft invoice schema with common fields
const baseDraftInvoiceSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the draft invoice",
    example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
  }),
  templateId: z.string().uuid().nullable().optional().openapi({
    description:
      "Reference to the invoice template used (for tracking which template was selected)",
    example: "c4d5e6f7-8901-2345-6789-abcdef012345",
  }),
  customerDetails: z.string().nullable().optional().openapi({
    description: "Customer details in stringified format",
    example: "John Doe, johndoe@email.com",
  }),
  customerId: z.string().uuid().nullable().optional().openapi({
    description: "Unique identifier for the customer",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
  customerName: z.string().nullable().optional().openapi({
    description: "Name of the customer",
    example: "Acme Corporation",
  }),
  noteDetails: z.string().nullable().optional().openapi({
    description: "Additional notes for the invoice",
    example: "Thank you for your business.",
  }),
  dueDate: z.string().openapi({
    description: "Due date of the invoice in ISO 8601 format",
    example: "2024-06-30T23:59:59.000Z",
  }),
  issueDate: z.string().openapi({
    description: "Issue date of the invoice in ISO 8601 format",
    example: "2024-06-01T00:00:00.000Z",
  }),
  invoiceNumber: z.string().optional().openapi({
    description:
      "Invoice number as shown to the customer (auto-generated if not provided)",
    example: "INV-2024-001",
  }),
  logoUrl: z.string().optional().nullable().openapi({
    description: "URL of the logo to display on the invoice",
    example: "https://example.com/logo.png",
  }),
  vat: z.number().nullable().optional().openapi({
    description: "VAT amount for the invoice",
    example: 150.0,
  }),
  tax: z.number().nullable().optional().openapi({
    description: "Tax amount for the invoice",
    example: 50.0,
  }),
  discount: z.number().nullable().optional().openapi({
    description: "Discount applied to the invoice",
    example: 100.0,
  }),
  amount: z.number().nullable().optional().openapi({
    description: "Total amount of the invoice",
    example: 1500.75,
  }),
  token: z.string().optional().openapi({
    description:
      "Unique token for the draft invoice (for sharing or public access)",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
  scheduledAt: z.string().nullable().optional().openapi({
    description: "Scheduled date of the invoice in ISO 8601 format",
    example: "2024-06-30T23:59:59.000Z",
  }),
  scheduledJobId: z.string().nullable().optional().openapi({
    description: "Scheduled job ID of the invoice",
    example: "1234567890",
  }),
});

// tRPC-compatible draft invoice schema (uses z.any() for editor fields)
export const draftInvoiceSchema = baseDraftInvoiceSchema.extend({
  template: upsertInvoiceTemplateSchema.openapi({
    description: "Invoice template details for the draft invoice",
  }),
  paymentDetails: z.string().optional().nullable(),
  fromDetails: z.string().optional().nullable(),
  topBlock: z.any().nullable().optional().openapi({
    description: "Custom content block to display at the top of the invoice",
  }),
  bottomBlock: z.any().nullable().optional().openapi({
    description: "Custom content block to display at the bottom of the invoice",
  }),
  lineItems: z.array(draftLineItemSchema).optional().openapi({
    description: "List of line items for the invoice",
  }),
});

// Draft invoice schema with TipTap validation for editor fields
export const restDraftInvoiceSchema = baseDraftInvoiceSchema.extend({
  template: restUpsertInvoiceTemplateSchema.openapi({
    description: "Invoice template details for the draft invoice",
  }),
  paymentDetails: editorFieldSchema.openapi({
    description: "Payment details in TipTap JSONContent format",
    example: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Bank: 123456, IBAN: DE1234567890",
            },
          ],
        },
      ],
    },
  }),
  fromDetails: editorFieldSchema.openapi({
    description: "Sender details in TipTap JSONContent format",
    example: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Acme Inc, 123 Main St, City, Country",
            },
          ],
        },
      ],
    },
  }),
  topBlock: editorFieldSchema.openapi({
    description:
      "Custom content block to display at the top of the invoice in TipTap JSONContent format",
  }),
  bottomBlock: editorFieldSchema.openapi({
    description:
      "Custom content block to display at the bottom of the invoice in TipTap JSONContent format",
  }),
  lineItems: z.array(restDraftLineItemSchema).optional().openapi({
    description: "List of line items for the invoice",
  }),
});

export const draftInvoiceSchemaWithOpenApi = draftInvoiceSchema.openapi({
  description: "Schema for creating or updating a draft invoice",
  example: {
    id: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
    template: {
      title: "Invoice",
      customerLabel: "To",
      fromLabel: "From",
      invoiceNoLabel: "Invoice No",
      issueDateLabel: "Issue Date",
      dueDateLabel: "Due Date",
      descriptionLabel: "Description",
      priceLabel: "Price",
      quantityLabel: "Quantity",
      totalLabel: "Total",
      totalSummaryLabel: "Total",
      vatLabel: "VAT",
      taxLabel: "Tax",
      paymentLabel: "Payment Details",
      noteLabel: "Note",
      logoUrl: "https://example.com/logo.png",
      currency: "USD",
      paymentDetails: "Bank: 123456, IBAN: DE1234567890",
      fromDetails: "Acme Inc, 123 Main St, City, Country",
      size: "a4",
      includeVat: true,
      includeTax: true,
      discountLabel: "Discount",
      includeDiscount: false,
      includeUnits: false,
      includeDecimals: false,
      includePdf: false,
      sendCopy: false,
      includeQr: true,
      dateFormat: "dd/MM/yyyy",
      taxRate: 0,
      vatRate: 0,
      deliveryType: "create",
      timezone: "UTC",
      locale: "en-US",
    },
    fromDetails: "Acme Inc, 123 Main St, City, Country",
    customerDetails: "John Doe, johndoe@email.com",
    customerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    paymentDetails: "Bank: 123456, IBAN: DE1234567890",
    noteDetails: "Thank you for your business.",
    dueDate: "2024-06-30T23:59:59.000Z",
    issueDate: "2024-06-01T00:00:00.000Z",
    invoiceNumber: "INV-2024-001",
    logoUrl: "https://example.com/logo.png",
    vat: 150.0,
    tax: 50.0,
    discount: 100.0,
    topBlock: null,
    bottomBlock: null,
    amount: 1500.75,
    lineItems: [
      {
        name: "Consulting Services",
        quantity: 10,
        unit: "hours",
        price: 100.0,
        vat: 15.0,
        tax: 5.0,
      },
    ],
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  price: z.number(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
  taxRate: z.number().min(0).max(100).optional(),
  // Optional product reference
  productId: z.string().uuid().optional(),
});

// Invoice product schemas
export const createInvoiceProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateInvoiceProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const searchInvoiceProductsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().min(1).max(50).default(10),
});

export const getInvoiceProductSchema = z.object({
  id: z.string().uuid(),
});

export const getInvoiceProductsSchema = z
  .object({
    sortBy: z.enum(["popular", "recent"]).default("popular"),
    limit: z.number().min(1).max(100).default(50),
    includeInactive: z.boolean().default(false),
    currency: z.string().optional().nullable(),
  })
  .optional();

export const deleteInvoiceProductSchema = z.object({
  id: z.string().uuid(),
});

export const saveLineItemAsProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  productId: z.string().uuid().optional(),
  currency: z.string().optional().nullable(),
});

export const upsertInvoiceProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
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
  includeLineItemTax: z.boolean().optional(),
  lineItemTaxLabel: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const getInvoicesSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "A cursor for pagination, representing the last item from the previous page.",
      param: { in: "query" },
      example: "25",
    }),
  sort: z
    .array(z.string().min(1))
    .max(2)
    .min(2)
    .nullable()
    .optional()
    .openapi({
      description:
        "Sorting order as a tuple: [field, direction]. Example: ['createdAt', 'desc'].",
      param: { in: "query" },
      example: ["createdAt", "desc"],
    }),
  pageSize: z.coerce
    .number()
    .min(1)
    .max(100)
    .optional()
    .openapi({
      description: "Number of invoices to return per page (1-100).",
      param: { in: "query" },
      example: 25,
    }),
  q: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description: "Search query string to filter invoices by text.",
      param: { in: "query" },
      example: "Acme",
    }),
  start: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Start date (inclusive) for filtering invoices, in ISO 8601 format.",
      param: { in: "query" },
      example: "2024-01-01",
    }),
  end: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "End date (inclusive) for filtering invoices, in ISO 8601 format.",
      param: { in: "query" },
      example: "2024-01-31",
    }),
  statuses: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "List of invoice statuses to filter by (e.g., 'paid', 'unpaid', 'overdue').",
      param: { in: "query" },
      example: ["paid", "unpaid"],
    }),
  customers: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "List of customer IDs to filter invoices.",
      param: { in: "query" },
      example: ["customer-uuid-1", "customer-uuid-2"],
    }),
  ids: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "List of invoice IDs to filter by.",
      param: { in: "query" },
      example: ["invoice-uuid-1", "invoice-uuid-2"],
    }),
  recurringIds: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "List of recurring series IDs to filter invoices by (shows all invoices from these series).",
      param: { in: "query" },
      example: ["recurring-uuid-1", "recurring-uuid-2"],
    }),
  recurring: z
    .boolean()
    .nullable()
    .optional()
    .openapi({
      description:
        "Filter by recurring status. true = only recurring invoices, false = only non-recurring invoices.",
      param: { in: "query" },
      example: true,
    }),
});

export const getInvoiceByIdSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const searchInvoiceNumberSchema = z.object({
  query: z.string(),
});

export const invoiceSummarySchema = z
  .object({
    statuses: z
      .array(
        z.enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"]),
      )
      .optional()
      .openapi({
        description: "Filter summary by invoice statuses",
        example: ["draft", "unpaid"],
        param: { in: "query" },
      }),
  })
  .openapi({
    description: "Query parameters for retrieving invoice summary",
  });

export const updateInvoiceSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
  status: z
    .enum(["paid", "canceled", "unpaid", "scheduled", "draft"])
    .optional(),
  paidAt: z.string().nullable().optional(),
  internalNote: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export const deleteInvoiceSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const createInvoiceSchema = z.object({
  id: z.string().uuid(),
  deliveryType: z.enum(["create", "create_and_send", "scheduled"]),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

export const remindInvoiceSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      param: {
        in: "path",
        name: "id",
      },
    }),
  date: z.string(),
});

export const updateScheduledInvoiceSchema = z.object({
  id: z.string().uuid(),
  scheduledAt: z.string().datetime({ offset: true }),
});

export const cancelScheduledInvoiceSchema = z.object({
  id: z.string().uuid(),
});

export const duplicateInvoiceSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      param: {
        in: "path",
        name: "id",
      },
    }),
});

export const getInvoiceByTokenSchema = z.object({
  token: z.string(),
});

// Template schema alias for compatibility
export const restInvoiceTemplateSchema = restUpsertInvoiceTemplateSchema;

// Invoice creation schemas with TipTap validation
export const createInvoiceRequestSchema = z
  .object({
    template: restInvoiceTemplateSchema.openapi({
      description: "Invoice template details",
    }),
    fromDetails: editorFieldSchema.openapi({
      description: "Sender details in TipTap JSONContent format",
      example: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Acme Inc, 123 Main St, City, Country",
              },
            ],
          },
        ],
      },
    }),
    customerId: z.string().uuid().openapi({
      description: "Unique identifier for the customer (required)",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    paymentDetails: editorFieldSchema.openapi({
      description: "Payment details in TipTap JSONContent format",
      example: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Bank: 123456, IBAN: DE1234567890",
              },
            ],
          },
        ],
      },
    }),
    noteDetails: editorFieldSchema.openapi({
      description:
        "Additional notes for the invoice in TipTap JSONContent format",
      example: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Thank you for your business.",
              },
            ],
          },
        ],
      },
    }),
    dueDate: z.string().datetime({ offset: true }).optional().openapi({
      description:
        "Due date of the invoice in ISO 8601 format. Defaults to issue date + payment terms (30 days) if not provided.",
      example: "2024-06-30T23:59:59.000Z",
    }),
    issueDate: z.string().datetime({ offset: true }).optional().openapi({
      description:
        "Issue date of the invoice in ISO 8601 format. Defaults to current date if not provided.",
      example: "2024-06-01T00:00:00.000Z",
    }),
    invoiceNumber: z.string().optional().openapi({
      description:
        "Invoice number as shown to the customer (auto-generated if not provided)",
      example: "INV-2024-001",
    }),
    logoUrl: z.string().optional().nullable().openapi({
      description: "URL of the logo to display on the invoice",
      example: "https://example.com/logo.png",
    }),
    vat: z.number().nullable().optional().openapi({
      description: "VAT amount for the invoice",
      example: 150.0,
    }),
    tax: z.number().nullable().optional().openapi({
      description: "Tax amount for the invoice",
      example: 50.0,
    }),
    discount: z.number().nullable().optional().openapi({
      description: "Discount applied to the invoice",
      example: 100.0,
    }),
    topBlock: editorFieldSchema.openapi({
      description:
        "Custom content block to display at the top of the invoice in TipTap JSONContent format",
    }),
    bottomBlock: editorFieldSchema.openapi({
      description:
        "Custom content block to display at the bottom of the invoice in TipTap JSONContent format",
    }),
    amount: z.number().nullable().optional().openapi({
      description: "Total amount of the invoice",
      example: 1500.75,
    }),
    lineItems: z.array(restDraftLineItemSchema).optional().openapi({
      description: "List of line items for the invoice",
    }),
    deliveryType: z.enum(["create", "create_and_send", "scheduled"]).openapi({
      description:
        "How the invoice should be processed: 'create' - finalize immediately, 'create_and_send' - finalize and send to customer, 'scheduled' - schedule for automatic processing at specified date",
      example: "create",
    }),
    scheduledAt: z.string().datetime({ offset: true }).optional().openapi({
      description:
        "Scheduled date of the invoice in ISO 8601 format with timezone offset (e.g., Z or +00:00). Required when deliveryType is 'scheduled'. Must be in the future.",
      example: "2024-06-30T23:59:59.000Z",
    }),
  })
  .openapi({
    description: "Base schema for invoice creation",
    example: {
      template: {
        title: "Invoice",
        customerLabel: "Bill To",
        fromLabel: "From",
        invoiceNoLabel: "Invoice #",
        issueDateLabel: "Issue Date",
        dueDateLabel: "Due Date",
        descriptionLabel: "Description",
        priceLabel: "Rate",
        quantityLabel: "Qty",
        totalLabel: "Amount",
        totalSummaryLabel: "Total",
        vatLabel: "VAT",
        taxLabel: "Sales Tax",
        paymentLabel: "Payment Information",
        noteLabel: "Notes",
        logoUrl: "https://example.com/logo.png",
        currency: "USD",
        paymentDetails: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Wire Transfer: Chase Bank, Account: 1234567890, Routing: 021000021",
                },
              ],
            },
          ],
        },
        fromDetails: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "TechCorp Inc, 123 Business Ave, San Francisco, CA 94105",
                },
              ],
            },
          ],
        },
        size: "letter",
        includeVat: false,
        includeTax: true,
        discountLabel: "Discount",
        includeDiscount: false,
        includeUnits: true,
        includeDecimals: true,
        includePdf: true,
        sendCopy: true,
        includeQr: false,
        dateFormat: "MM/dd/yyyy",
        taxRate: 8.5,
        vatRate: 0,
        deliveryType: "create",
        timezone: "America/Los_Angeles",
        locale: "en-US",
      },
      fromDetails: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "TechCorp Inc",
                marks: [{ type: "strong" }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "123 Business Ave",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "San Francisco, CA 94105",
              },
            ],
          },
        ],
      },
      customerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      paymentDetails: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Wire Transfer:",
                marks: [{ type: "strong" }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Chase Bank, Account: 1234567890",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Routing: 021000021",
              },
            ],
          },
        ],
      },
      noteDetails: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Payment is due within 30 days of invoice date.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Thank you for your business!",
                marks: [{ type: "italic" }],
              },
            ],
          },
        ],
      },
      dueDate: "2024-07-15T23:59:59.000Z",
      issueDate: "2024-06-15T00:00:00.000Z",
      invoiceNumber: "INV-2024-001",
      logoUrl: "https://example.com/logo.png",
      vat: undefined,
      tax: 85.0,
      discount: undefined,
      topBlock: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Thank you for choosing TechCorp for your software development needs.",
                marks: [{ type: "strong" }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This invoice covers the development work completed in June 2024.",
              },
            ],
          },
        ],
      },
      bottomBlock: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Terms & Conditions:",
                marks: [{ type: "strong" }],
              },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Payment is due within 30 days of invoice date",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Late payments may incur a 1.5% monthly service charge",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "All work is subject to our standard terms of service",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Questions? Contact us at billing@techcorp.com or (555) 123-4567",
                marks: [{ type: "italic" }],
              },
            ],
          },
        ],
      },
      amount: 1085.0,
      lineItems: [
        {
          name: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Web Development Services",
                    marks: [{ type: "strong" }],
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Custom React application with TypeScript",
                    marks: [{ type: "italic" }],
                  },
                ],
              },
            ],
          },
          quantity: 40,
          price: 75.0,
          tax: 8.5,
        },
        {
          name: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "UI/UX Design",
                    marks: [{ type: "strong" }],
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "User interface design and user experience optimization",
                    marks: [{ type: "italic" }],
                  },
                ],
              },
            ],
          },
          quantity: 20,
          price: 50.0,
          tax: 8.5,
        },
      ],
      deliveryType: "create",
      scheduledAt: "2024-07-01T09:00:00.000Z", // Only required for deliveryType: "scheduled"
    },
  });

export const draftInvoiceRequestSchema = createInvoiceRequestSchema.openapi({
  description:
    "Schema for creating an invoice. The deliveryType determines if it stays as a draft, gets finalized immediately, or gets scheduled for later processing.",
});

export const draftInvoiceResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the draft invoice",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
    }),
    status: z
      .enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"])
      .openapi({
        description: "Current status of the invoice",
        example: "draft",
      }),
    createdAt: z.string().openapi({
      description: "Timestamp when the invoice was created (ISO 8601)",
      example: "2024-06-01T07:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "Timestamp when the invoice was last updated (ISO 8601)",
      example: "2024-06-01T07:00:00.000Z",
    }),
    pdfUrl: z.string().nullable().openapi({
      description: "Direct URL to download the invoice PDF",
      example: "https://app.midday.ai/api/download/invoice?token=eyJ...",
    }),
    previewUrl: z.string().nullable().openapi({
      description: "Direct URL to preview the invoice in browser",
      example: "https://app.midday.ai/i/eyJ...",
    }),
  })
  .openapi({
    description: "Response after creating a draft invoice",
  });

export const invoiceResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the invoice",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
    }),
    status: z
      .enum(["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"])
      .openapi({
        description: "Current status of the invoice",
        example: "paid",
      }),
    dueDate: z.string().openapi({
      description: "Due date of the invoice in ISO 8601 format",
      example: "2024-06-30T23:59:59.000Z",
    }),
    issueDate: z.string().openapi({
      description: "Issue date of the invoice in ISO 8601 format",
      example: "2024-06-01T00:00:00.000Z",
    }),
    invoiceNumber: z.string().optional().openapi({
      description:
        "Invoice number as shown to the customer (auto-generated if not provided)",
      example: "INV-2024-001",
    }),
    amount: z.number().openapi({
      description: "Total amount of the invoice",
      example: 1500.75,
    }),
    currency: z.string().openapi({
      description: "Currency code (ISO 4217) for the invoice amount",
      example: "USD",
    }),
    customer: z
      .object({
        id: z.string().uuid().openapi({
          description: "Unique identifier for the customer",
          example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        }),
        name: z.string().openapi({
          description: "Name of the customer",
          example: "Acme Corporation",
        }),
        website: z.string().nullable().openapi({
          description: "Website URL of the customer",
          example: "https://acme.com",
        }),
        email: z.string().email().nullable().openapi({
          description: "Email address of the customer",
          example: "info@acme.com",
        }),
      })
      .nullable()
      .openapi({
        description: "Customer details",
      }),
    paidAt: z.string().nullable().openapi({
      description:
        "Timestamp when the invoice was paid (ISO 8601), or null if unpaid",
      example: "2024-06-15T12:00:00.000Z",
    }),
    reminderSentAt: z.string().nullable().openapi({
      description:
        "Timestamp when a payment reminder was sent (ISO 8601), or null if never sent",
      example: "2024-06-10T09:00:00.000Z",
    }),
    note: z.string().nullable().openapi({
      description: "Optional note attached to the invoice",
      example: "Thank you for your business.",
    }),
    vat: z.number().nullable().openapi({
      description: "Value-added tax amount, or null if not applicable",
      example: 120.0,
    }),
    tax: z.number().nullable().openapi({
      description: "Tax amount, or null if not applicable",
      example: 80.0,
    }),
    discount: z.number().nullable().openapi({
      description: "Discount amount applied to the invoice, or null if none",
      example: 50.0,
    }),
    subtotal: z.number().nullable().openapi({
      description:
        "Subtotal before taxes and discounts, or null if not calculated",
      example: 1400.0,
    }),
    viewedAt: z.string().nullable().openapi({
      description:
        "Timestamp when the invoice was viewed by the customer (ISO 8601), or null if never viewed",
      example: "2024-06-05T14:30:00.000Z",
    }),
    customerName: z.string().nullable().openapi({
      description:
        "Name of the customer as shown on the invoice, or null if not set",
      example: "Acme Corporation",
    }),
    sentTo: z.string().email().nullable().openapi({
      description:
        "Email address to which the invoice was sent, or null if not sent",
      example: "billing@acme.com",
    }),
    sentAt: z.string().nullable().openapi({
      description:
        "Timestamp when the invoice was sent (ISO 8601), or null if not sent",
      example: "2024-06-02T08:00:00.000Z",
    }),
    createdAt: z.string().openapi({
      description: "Timestamp when the invoice was created (ISO 8601)",
      example: "2024-06-01T07:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "Timestamp when the invoice was last updated (ISO 8601)",
      example: "2024-06-15T10:00:00.000Z",
    }),
    pdfUrl: z.string().url().nullable().openapi({
      description: "URL to download the invoice PDF, or null if not generated",
      example:
        "https://app.midday.ai/api/download/invoice?token=eef58951-1682-4062-b010-425866032390",
    }),
    previewUrl: z.string().url().nullable().openapi({
      description:
        "URL to preview the invoice in the browser, or null if not generated",
      example: "https://app.midday.ai/i/eef58951-1682-4062-b010-425866032390",
    }),
  })
  .openapi({
    description: "Invoice object",
  });

export const createInvoiceResponseSchema = invoiceResponseSchema.openapi({
  description: "Response after creating an invoice",
});

export const updateInvoiceRequestSchema = z
  .object({
    status: z
      .enum(["paid", "canceled", "unpaid", "scheduled", "draft"])
      .optional()
      .openapi({
        description: "New status for the invoice",
        example: "paid",
      }),
    paidAt: z.string().datetime().nullable().optional().openapi({
      description: "Timestamp when the invoice was paid (ISO 8601)",
      example: "2024-06-15T12:00:00.000Z",
    }),
    internalNote: z.string().nullable().optional().openapi({
      description: "Internal note for the invoice",
      example: "Payment received via bank transfer",
    }),
  })
  .openapi({
    description: "Schema for updating an invoice",
  });

export const updateInvoiceResponseSchema = invoiceResponseSchema.openapi({
  description: "Response after updating an invoice",
});

export const invoicesResponseSchema = z
  .object({
    meta: z
      .object({
        cursor: z.string().nullable().openapi({
          description: "Cursor for pagination; null if there is no next page",
          example: "25",
        }),
        hasPreviousPage: z.boolean().openapi({
          description: "Indicates if there is a previous page of results",
          example: false,
        }),
        hasNextPage: z.boolean().openapi({
          description: "Indicates if there is a next page of results",
          example: true,
        }),
      })
      .openapi({
        description: "Pagination metadata",
      }),
    data: z.array(invoiceResponseSchema).openapi({
      description: "Array of invoice objects",
    }),
  })
  .openapi({
    description:
      "Response containing a list of invoices and pagination metadata",
  });

export const deleteInvoiceResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier for the deleted invoice",
    example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
  }),
});

export const getPaymentStatusResponseSchema = z.object({
  score: z.number().openapi({
    description: "Score associated with the invoice payment status",
    example: 85,
  }),
  paymentStatus: z.string().openapi({
    description: "The payment status of the invoice",
    example: "good",
  }),
});

export const invoiceSummaryResponseSchema = z
  .object({
    currency: z.string().openapi({
      description: "Base currency of the team",
      example: "USD",
    }),
    totalAmount: z.number().openapi({
      description: "Total amount of all invoices converted to base currency",
      example: 224171.25,
    }),
    invoiceCount: z.number().openapi({
      description: "Total number of invoices",
      example: 15,
    }),
    breakdown: z
      .array(
        z.object({
          currency: z.string().openapi({
            description: "Original currency of the invoices",
            example: "EUR",
          }),
          originalAmount: z.number().openapi({
            description: "Total amount in original currency",
            example: 15000.5,
          }),
          convertedAmount: z.number().openapi({
            description: "Amount converted to base currency",
            example: 16250.75,
          }),
          count: z.number().openapi({
            description: "Number of invoices in this currency",
            example: 5,
          }),
        }),
      )
      .optional()
      .openapi({
        description: "Currency breakdown when multiple currencies are involved",
        example: [
          {
            currency: "EUR",
            originalAmount: 15000.5,
            convertedAmount: 16250.75,
            count: 5,
          },
          {
            currency: "GBP",
            originalAmount: 8000.25,
            convertedAmount: 9200.5,
            count: 3,
          },
        ],
      }),
  })
  .openapi({
    description:
      "Invoice summary object containing total amount converted to team's base currency and total invoice count.",
    example: {
      currency: "USD",
      totalAmount: 224171.25,
      invoiceCount: 15,
      breakdown: [
        {
          currency: "EUR",
          originalAmount: 15000.5,
          convertedAmount: 16250.75,
          count: 5,
        },
        {
          currency: "GBP",
          originalAmount: 8000.25,
          convertedAmount: 9200.5,
          count: 3,
        },
      ],
    },
  });
