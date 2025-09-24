import { z } from "@hono/zod-openapi";

export const getInboxSchema = z.object({
  cursor: z.string().nullable().optional(),
  order: z.string().nullable().optional(),
  sort: z.string().nullable().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  q: z.string().nullable().optional(),
  status: z
    .enum(["done", "pending", "suggested_match", "no_match"])
    .nullable()
    .optional(),
});

export const inboxItemResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Inbox item ID (UUID)",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    }),
    fileName: z.string().openapi({
      description: "Original file name of the uploaded document",
      example: "invoice-123.pdf",
    }),
    filePath: z.array(z.string()).openapi({
      description: "Path segments to the file in storage",
      example: ["inbox", "2024", "05", "invoice-123.pdf"],
    }),
    displayName: z.string().openapi({
      description: "Display name for the inbox item",
      example: "Invoice May 2024",
    }),
    amount: z.number().nullable().openapi({
      description: "Amount detected or entered for the inbox item",
      example: 123.45,
    }),
    currency: z.string().nullable().openapi({
      description: "Currency code (ISO 4217) for the amount",
      example: "USD",
    }),
    contentType: z.string().nullable().openapi({
      description: "MIME type of the uploaded file",
      example: "application/pdf",
    }),
    date: z.string().nullable().openapi({
      description: "Date associated with the inbox item (ISO 8601)",
      example: "2024-05-01",
    }),
    status: z.string().openapi({
      description: "Status of the inbox item",
      example: "pending",
    }),
    createdAt: z.string().openapi({
      description: "Date and time when the inbox item was created (ISO 8601)",
      example: "2024-05-01T12:34:56.789Z",
    }),
    website: z.string().nullable().openapi({
      description: "Website associated with the inbox item, if any",
      example: "https://vendor.com",
    }),
    description: z.string().nullable().openapi({
      description: "Description or notes for the inbox item",
      example: "Invoice for May 2024 services",
    }),
    transaction: z
      .object({
        id: z.string().openapi({
          description: "Transaction ID (UUID)",
          example: "a1b2c3d4-5678-4e7a-9c1a-2b7c1e24c2a4",
        }),
        amount: z.number().openapi({
          description: "Transaction amount",
          example: 123.45,
        }),
        currency: z.string().openapi({
          description: "Transaction currency (ISO 4217)",
          example: "USD",
        }),
        name: z.string().openapi({
          description: "Transaction name or payee",
          example: "Acme Corp",
        }),
        date: z.string().openapi({
          description: "Transaction date (ISO 8601)",
          example: "2024-05-01",
        }),
      })
      .nullable()
      .openapi({
        description: "Matched transaction for this inbox item, if any",
      }),
  })
  .openapi({
    description: "Inbox item object",
  });

export const inboxResponseSchema = z.object({
  meta: z
    .object({
      cursor: z.string().nullable().optional().openapi({
        description:
          "A cursor for pagination, representing the last item from the previous page.",
        example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      }),
      hasPreviousPage: z.boolean().openapi({
        description: "Whether there is a previous page of results.",
        example: false,
      }),
      hasNextPage: z.boolean().openapi({
        description: "Whether there is a next page of results.",
        example: true,
      }),
    })
    .openapi({
      description: "Pagination metadata for the inbox list response.",
    }),
  data: z.array(inboxItemResponseSchema).openapi({
    description: "List of inbox items",
  }),
});

export const getInboxByIdSchema = z
  .object({
    id: z.string().openapi({
      description: "The unique identifier of the inbox item.",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "path",
        name: "id",
      },
    }),
  })
  .openapi({
    description: "Schema for retrieving an inbox item by its ID.",
  });

export const deleteInboxSchema = z
  .object({
    id: z.string().openapi({
      description: "The unique identifier of the inbox item to delete.",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "path",
        name: "id",
      },
    }),
  })
  .openapi({
    description: "Schema for deleting an inbox item by its ID.",
  });

export const createInboxItemSchema = z.object({
  filename: z.string(),
  mimetype: z.string(),
  size: z.number(),
  filePath: z.array(z.string()),
});

export const processAttachmentsSchema = z.array(
  z.object({
    mimetype: z.string(),
    size: z.number(),
    filePath: z.array(z.string()),
  }),
);

export const searchInboxSchema = z.object({
  q: z.string().optional(), // Search query (text or amount)
  transactionId: z.string().optional(), // For AI suggestions
  limit: z.number().optional().default(10),
});

export const updateInboxSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
  status: z
    .enum([
      "new",
      "archived",
      "processing",
      "done",
      "pending",
      "deleted",
      "analyzing",
      "suggested_match",
    ])
    .optional(),
  displayName: z.string().optional(),
  currency: z.string().optional(),
  amount: z.number().optional(),
});

export const matchTransactionSchema = z.object({
  id: z.string(),
  transactionId: z.string().uuid(),
});

export const unmatchTransactionSchema = z.object({
  id: z.string().uuid(),
});

export const retryMatchingSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Inbox item ID to retry matching for",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
});

export const getInboxByStatusSchema = z.object({
  status: z
    .enum([
      "processing",
      "pending",
      "archived",
      "new",
      "analyzing",
      "suggested_match",
      "no_match",
      "done",
      "deleted",
    ])
    .optional(),
});

export const confirmMatchSchema = z.object({
  suggestionId: z.string().uuid(),
  inboxId: z.string().uuid(),
  transactionId: z.string().uuid(),
});

export const declineMatchSchema = z.object({
  suggestionId: z.string().uuid(),
  inboxId: z.string().uuid(),
});

export const deleteInboxResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "The unique identifier of the deleted inbox item.",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    }),
  })
  .openapi({
    description: "Response schema for a successfully deleted inbox item.",
  });

export const getInboxPreSignedUrlSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description:
        "Unique identifier of the inbox item to generate a pre-signed URL for",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "path",
        name: "id",
      },
    }),
  download: z.coerce
    .boolean()
    .optional()
    .openapi({
      description:
        "Whether to force download the file. If true, the file will be downloaded. If false or omitted, the file will be displayed in the browser if possible.",
      example: true,
      param: {
        in: "query",
        name: "download",
      },
    }),
});

export const inboxPreSignedUrlResponseSchema = z.object({
  url: z.string().url().openapi({
    description:
      "Pre-signed URL for accessing the inbox attachment, valid for 60 seconds",
    example:
      "https://service.midday.ai/storage/v1/object/sign/vault/inbox/document.pdf?token=abc123&expires=1640995200",
  }),
  expiresAt: z.string().datetime().openapi({
    description: "ISO 8601 timestamp when the URL expires",
    example: "2024-04-15T10:01:00.000Z",
  }),
  fileName: z.string().nullable().openapi({
    description: "Original filename of the inbox attachment",
    example: "invoice.pdf",
  }),
});
