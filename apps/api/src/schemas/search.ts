import { z } from "@hono/zod-openapi";

export const globalSearchSchema = z
  .object({
    searchTerm: z.string().optional().openapi({
      description: "The term to search for across all data sources.",
      example: "Acme",
    }),
    language: z.string().optional().openapi({
      description: "Language code to use for search relevance and results.",
      example: "en",
    }),
    limit: z.coerce.number().min(1).max(1000).default(30).openapi({
      description: "Maximum number of results to return.",
      example: 30,
    }),
    itemsPerTableLimit: z.coerce.number().min(1).max(100).default(5).openapi({
      description: "Maximum number of results to return per table/entity.",
      example: 5,
    }),
    relevanceThreshold: z.coerce.number().min(0).max(1).default(0.01).openapi({
      description: "Minimum relevance score threshold for including a result.",
      example: 0.01,
    }),
  })
  .openapi({
    description:
      "Parameters for performing a global search across all data sources.",
  });

export const searchResponseSchema = z
  .array(
    z.object({
      id: z.string().openapi({
        description: "Unique identifier for the search result item.",
        example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      }),
      type: z.string().openapi({
        description:
          "Type of the entity returned (e.g., invoice, customer, transaction).",
        example: "invoice",
      }),
      relevance: z.number().openapi({
        description: "Relevance score for the search result.",
        example: 0.92,
      }),
      created_at: z.string().openapi({
        description: "ISO 8601 timestamp when the entity was created.",
        example: "2024-06-01T00:00:00.000Z",
      }),
      data: z.any().openapi({
        description:
          "Additional data for the search result, structure depends on the type.",
        example: {
          invoiceNumber: "INV-2024-001",
          customerName: "Acme Corporation",
          amount: 1500.75,
        },
      }),
    }),
  )
  .openapi({
    description: "Search results.",
    example: [
      {
        id: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
        type: "invoice",
        relevance: 0.92,
        created_at: "2024-06-01T00:00:00.000Z",
        data: {
          invoiceNumber: "INV-2024-001",
          customerName: "Acme Corporation",
          amount: 1500.75,
        },
      },
    ],
  });

export const searchAttachmentsSchema = z
  .object({
    q: z.string().nullable().optional().openapi({
      description: "Search query string to filter attachments by text.",
      example: "invoice",
    }),
    transactionId: z.string().uuid().nullable().optional().openapi({
      description:
        "Transaction ID for smart suggestions based on transaction details.",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    limit: z.coerce.number().min(1).max(100).default(30).openapi({
      description: "Maximum number of results to return.",
      example: 30,
    }),
  })
  .openapi({
    description:
      "Parameters for searching attachments (inbox items and invoices).",
  });

export const attachmentSearchResultSchema = z
  .union([
    z.object({
      type: z.literal("inbox"),
      id: z.string(),
      fileName: z.string().nullable(),
      filePath: z.array(z.string()),
      displayName: z.string().nullable(),
      amount: z.number().nullable(),
      currency: z.string().nullable(),
      contentType: z.string().nullable(),
      date: z.string().nullable(),
      size: z.number().nullable(),
      description: z.string().nullable(),
      status: z.string().nullable(),
      website: z.string().nullable(),
      baseAmount: z.number().nullable(),
      baseCurrency: z.string().nullable(),
      taxAmount: z.number().nullable(),
      taxRate: z.number().nullable(),
      taxType: z.string().nullable(),
      createdAt: z.string(),
    }),
    z.object({
      type: z.literal("invoice"),
      id: z.string(),
      invoiceNumber: z.string().nullable(),
      customerName: z.string().nullable(),
      amount: z.number().nullable(),
      currency: z.string().nullable(),
      filePath: z.array(z.string()).nullable(),
      dueDate: z.string().nullable(),
      status: z.string(),
      size: z.number().nullable(),
      createdAt: z.string(),
    }),
  ])
  .openapi({
    description: "Unified attachment search result (inbox item or invoice).",
  });
