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

export const draftInvoiceSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the draft invoice",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
    }),
    template: upsertInvoiceTemplateSchema.openapi({
      description: "Invoice template details for the draft invoice",
    }),
    fromDetails: z.string().nullable().optional().openapi({
      description: "Sender details in stringified format",
      example: "Acme Inc, 123 Main St, City, Country",
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
    paymentDetails: z.string().nullable().optional().openapi({
      description: "Payment details in stringified format",
      example: "Bank: 123456, IBAN: DE1234567890",
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
    invoiceNumber: z.string().openapi({
      description: "Invoice number as shown to the customer",
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
    subtotal: z.number().nullable().optional().openapi({
      description: "Subtotal amount before taxes and discounts",
      example: 1400.0,
    }),
    topBlock: z.any().nullable().optional().openapi({
      description: "Custom content block to display at the top of the invoice",
    }),
    bottomBlock: z.any().nullable().optional().openapi({
      description:
        "Custom content block to display at the bottom of the invoice",
    }),
    amount: z.number().nullable().optional().openapi({
      description: "Total amount of the invoice",
      example: 1500.75,
    }),
    lineItems: z.array(draftLineItemSchema).optional().openapi({
      description: "List of line items for the invoice",
    }),
    token: z.string().optional().openapi({
      description:
        "Unique token for the draft invoice (for sharing or public access)",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
  })
  .openapi({
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
      customerName: "Acme Corporation",
      paymentDetails: "Bank: 123456, IBAN: DE1234567890",
      noteDetails: "Thank you for your business.",
      dueDate: "2024-06-30T23:59:59.000Z",
      issueDate: "2024-06-01T00:00:00.000Z",
      invoiceNumber: "INV-2024-001",
      logoUrl: "https://example.com/logo.png",
      vat: 150.0,
      tax: 50.0,
      discount: 100.0,
      subtotal: 1400.0,
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
    .array(z.string(), z.string())
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
    status: z
      .enum(["draft", "overdue", "paid", "unpaid", "canceled"])
      .optional()
      .openapi({
        description: "Filter summary by invoice status",
        example: "paid",
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
  status: z.enum(["paid", "canceled", "unpaid"]).optional(),
  paidAt: z.string().nullable().optional(),
  internalNote: z.string().nullable().optional(),
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
  deliveryType: z.enum(["create", "create_and_send"]),
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

export const invoiceResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the invoice",
      example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
    }),
    status: z.enum(["draft", "overdue", "paid", "unpaid", "canceled"]).openapi({
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
    invoiceNumber: z.string().openapi({
      description: "Invoice number as shown to the customer",
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
  })
  .openapi({
    description: "Invoice object",
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
  .array(
    z.object({
      currency: z.string().openapi({
        description: "Currency of the invoice",
        example: "SEK",
      }),
      totalAmount: z.number().openapi({
        description: "Total amount of the invoice",
        example: 224171.25,
      }),
      invoiceCount: z.number().openapi({
        description: "Number of invoices for this currency",
        example: 15,
      }),
    }),
  )
  .openapi({
    description:
      "Array of invoice summary objects, each containing currency, total amount, and invoice count.",
    example: [
      {
        currency: "SEK",
        totalAmount: 224171.25,
        invoiceCount: 15,
      },
    ],
  });
