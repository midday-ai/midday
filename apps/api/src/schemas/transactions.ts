import { z } from "@hono/zod-openapi";

export const getTransactionsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Cursor for pagination, representing the last item from the previous page",
      example: "eyJpZCI6IjEyMyJ9",
      param: {
        in: "query",
      },
    }),
  sort: z
    .array(z.string(), z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Sorting order as a tuple: [field, direction]. Example: ['date', 'desc'] or ['amount', 'asc']",
      example: ["date", "desc"],
      param: {
        in: "query",
      },
    }),
  pageSize: z.coerce
    .number()
    .min(1)
    .max(10000)
    .optional()
    .openapi({
      description: "Number of transactions to return per page (1-10000)",
      example: 50,
      param: {
        in: "query",
      },
    }),

  q: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Search query string to filter transactions by name, description, or other text fields",
      example: "office supplies",
      param: {
        in: "query",
      },
    }),
  categories: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of category slugs to filter transactions by specific categories",
      example: ["office-supplies", "travel"],
      param: {
        in: "query",
      },
    }),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "Array of tag IDs to filter transactions by specific tags",
      example: ["tag-1", "tag-2"],
      param: {
        in: "query",
      },
    }),
  start: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "Start date (inclusive) for filtering transactions in ISO 8601 format",
      example: "2024-04-01T00:00:00.000Z",
      param: {
        in: "query",
      },
    }),
  end: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "End date (inclusive) for filtering transactions in ISO 8601 format",
      example: "2024-04-30T23:59:59.999Z",
      param: {
        in: "query",
      },
    }),
  accounts: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of bank account IDs to filter transactions by specific accounts",
      example: ["account-1", "account-2"],
      param: {
        in: "query",
      },
    }),
  assignees: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description: "Array of user IDs to filter transactions by assigned users",
      example: ["user-1", "user-2"],
      param: {
        in: "query",
      },
    }),
  statuses: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of transaction statuses to filter by. Available statuses: 'pending', 'completed', 'archived', 'posted', 'excluded'",
      example: ["pending", "completed"],
      param: {
        in: "query",
      },
    }),
  recurring: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of recurring frequency values to filter by. Available frequencies: 'weekly', 'monthly', 'annually', 'irregular'",
      example: ["monthly", "annually"],
      param: {
        in: "query",
      },
    }),
  attachments: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .openapi({
      description:
        "Filter transactions based on attachment presence. 'include' returns only transactions with attachments, 'exclude' returns only transactions without attachments",
      example: "include",
      param: {
        in: "query",
      },
    }),
  amountRange: z
    .array(z.coerce.number())
    .nullable()
    .optional()
    .openapi({
      description:
        "Amount range as [min, max] to filter transactions by monetary value",
      example: [100, 1000],
      param: {
        in: "query",
      },
    }),
  amount: z
    .array(z.string())
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of specific amounts (as strings) to filter transactions by exact values",
      example: ["150.75", "299.99"],
      param: {
        in: "query",
      },
    }),
  type: z
    .enum(["income", "expense"])
    .nullable()
    .optional()
    .openapi({
      description:
        "Transaction type to filter by. 'income' for money received, 'expense' for money spent",
      example: "expense",
      param: {
        in: "query",
      },
    }),
});

export const transactionResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the transaction",
      example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    }),
    name: z.string().openapi({
      description: "Name or description of the transaction",
      example: "Office Supplies Purchase",
    }),
    amount: z.number().openapi({
      description: "Monetary amount of the transaction",
      example: 150.75,
    }),
    taxAmount: z.number().nullable().openapi({
      description: "Tax amount of the transaction",
      example: 15.07,
    }),
    taxRate: z.number().nullable().openapi({
      description: "Tax rate of the transaction",
      example: 10,
    }),
    taxType: z.string().nullable().openapi({
      description: "Tax type of the transaction",
      example: "VAT",
    }),
    currency: z.string().openapi({
      description: "Currency code of the transaction in ISO 4217 format",
      example: "USD",
    }),
    counterpartyName: z.string().nullable().openapi({
      description: "Name of the counterparty",
      example: "Spotify AB",
    }),
    date: z.string().openapi({
      description: "Date and time of the transaction in ISO 8601 format",
      example: "2024-05-01T12:00:00.000Z",
    }),
    category: z
      .object({
        id: z.string().openapi({
          description: "Unique identifier of the category",
          example: "office-supplies",
        }),
        name: z.string().openapi({
          description: "Display name of the category",
          example: "Office Supplies",
        }),
        color: z.string().openapi({
          description:
            "Hex color code associated with the category for UI display",
          example: "#FF5733",
        }),
        taxRate: z.number().nullable().openapi({
          description: "Tax rate of the category",
          example: 10,
        }),
        taxType: z.string().nullable().openapi({
          description: "Tax type of the category",
          example: "VAT",
        }),
        slug: z.string().openapi({
          description: "URL-friendly slug of the category",
          example: "office-supplies",
        }),
      })
      .nullable()
      .openapi({
        description:
          "Category information assigned to the transaction for organization",
        example: {
          id: "office-supplies",
          name: "Office Supplies",
          color: "#FF5733",
          slug: "office-supplies",
          taxRate: 10,
          taxType: "VAT",
        },
      }),
    status: z.string().openapi({
      description: "Current status of the transaction",
      example: "completed",
    }),
    internal: z.boolean().nullable().openapi({
      description: "Whether the transaction is internal (between own accounts)",
      example: false,
    }),
    recurring: z.boolean().nullable().openapi({
      description: "Whether the transaction is part of a recurring series",
      example: false,
    }),
    manual: z.boolean().nullable().openapi({
      description:
        "Whether the transaction was created manually (via API/form) rather than imported from bank connections",
      example: false,
    }),
    frequency: z.string().nullable().openapi({
      description:
        "Frequency of the recurring transaction if applicable (weekly, monthly, annually, irregular)",
      example: "monthly",
    }),
    isFulfilled: z.boolean().openapi({
      description: "Whether the transaction has been fulfilled or processed",
      example: true,
    }),
    note: z.string().nullable().openapi({
      description: "Optional note or memo attached to the transaction",
      example: "Paid with company credit card for office renovation",
    }),
    account: z
      .object({
        id: z.string().openapi({
          description: "Unique identifier of the bank account",
          example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
        }),
        name: z.string().openapi({
          description: "Display name of the bank account",
          example: "Company Credit Card",
        }),
        currency: z.string().openapi({
          description: "Currency of the bank account in ISO 4217 format",
          example: "USD",
        }),
        connection: z
          .object({
            id: z.string().openapi({
              description: "Unique identifier of the bank connection",
              example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
            }),
            name: z.string().openapi({
              description: "Name of the bank institution",
              example: "Chase Bank",
            }),
            logoUrl: z.string().nullable().openapi({
              description: "URL to the bank institution's logo image",
              example: "https://cdn.midday.ai/logos/chase-bank.png",
            }),
          })
          .openapi({
            description:
              "Bank connection information associated with the account",
            example: {
              id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
              name: "Chase Bank",
              logoUrl: "https://cdn.midday.ai/logos/chase-bank.png",
            },
          }),
      })
      .openapi({
        description: "Bank account information associated with the transaction",
        example: {
          id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
          name: "Company Credit Card",
          currency: "USD",
          connection: {
            id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
            name: "Chase Bank",
            logoUrl: "https://cdn.midday.ai/logos/chase-bank.png",
          },
        },
      }),
    tags: z
      .array(
        z.object({
          id: z.string().openapi({
            description: "Unique identifier of the tag",
            example: "b7e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7b",
          }),
          name: z.string().nullable().openapi({
            description: "Display name of the tag",
            example: "invoice",
          }),
        }),
      )
      .nullable()
      .openapi({
        description:
          "Array of tags associated with the transaction for categorization and filtering",
        example: [
          { id: "b7e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7b", name: "invoice" },
          { id: "c8e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7c", name: "travel" },
        ],
      }),
    attachments: z
      .array(
        z.object({
          id: z.string().openapi({
            description: "Unique identifier of the attachment",
            example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
          }),
          path: z.array(z.string()).openapi({
            description:
              "Array of path segments for the attachment file storage location",
            example: [
              "dd6a039e-d071-423a-9a4d-9ba71325d890",
              "transactions",
              "1d2c3753-79d7-45b0-9c40-60f482bac8e8",
              "receipt.pdf",
            ],
          }),
          size: z.number().openapi({
            description: "Size of the attachment file in bytes",
            example: 1928716,
          }),
          type: z.string().openapi({
            description: "MIME type of the attachment file",
            example: "application/pdf",
          }),
          filename: z.string().nullable().openapi({
            description: "Original filename of the attachment when uploaded",
            example: "receipt.pdf",
          }),
        }),
      )
      .nullable()
      .openapi({
        description:
          "Array of file attachments associated with the transaction (receipts, invoices, etc.)",
        example: [
          {
            id: "b7e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7b",
            path: [
              "e1f2d3c4-b5a6-7d8e-9f0a-1b2c3d4e5f6a",
              "transactions",
              "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
              "receipt.pdf",
            ],
            size: 1928716,
            type: "application/pdf",
            filename: "receipt.pdf",
          },
        ],
      }),
  })
  .openapi("TransactionResponse");

export const transactionsResponseSchema = z.object({
  meta: z
    .object({
      cursor: z.string().optional().openapi({
        description:
          "Cursor for the next page of results, undefined if no more pages",
        example: "eyJpZCI6IjQ1NiJ9",
      }),
      hasPreviousPage: z.boolean().openapi({
        description:
          "Whether there are more transactions available on the previous page",
        example: false,
      }),
      hasNextPage: z.boolean().openapi({
        description:
          "Whether there are more transactions available on the next page",
        example: true,
      }),
    })
    .openapi({
      description: "Pagination metadata for the transactions response",
    }),
  data: z.array(transactionResponseSchema).openapi({
    description: "Array of transactions matching the query criteria",
  }),
});

export const deleteTransactionsSchema = z
  .array(z.string().uuid())
  .max(100)
  .min(1)
  .openapi({
    description: "List of transaction IDs to delete.",
  });

export const deleteTransactionResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Transaction ID (UUID).",
  }),
});

export const deleteTransactionsResponseSchema = z.array(
  deleteTransactionResponseSchema,
);

export const deleteTransactionSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Transaction ID (UUID).",
      param: {
        in: "path",
        name: "id",
      },
    }),
});

export const getTransactionByIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Transaction ID (UUID).",
      param: {
        in: "path",
        name: "id",
      },
    }),
});

export const updateTransactionSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Transaction ID (UUID).",
      param: {
        in: "path",
        name: "id",
      },
    }),
  categorySlug: z.string().nullable().optional().openapi({
    description: "Category slug for the transaction.",
  }),
  status: z
    .enum(["pending", "archived", "completed", "posted", "excluded"])
    .nullable()
    .optional()
    .openapi({
      description: "Status of the transaction.",
    }),
  internal: z.boolean().optional().openapi({
    description: "Whether the transaction is internal.",
  }),
  recurring: z.boolean().optional().openapi({
    description: "Whether the transaction is recurring.",
  }),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .nullable()
    .optional()
    .openapi({
      description: "Recurring frequency of the transaction.",
    }),
  note: z.string().nullable().optional().openapi({
    description: "Note for the transaction.",
  }),
  assignedId: z.string().nullable().optional().openapi({
    description: "Assigned user ID for the transaction.",
  }),
});

export const updateTransactionsSchema = z.object({
  ids: z.array(z.string()).openapi({
    description: "Array of transaction IDs to update.",
  }),
  categorySlug: z.string().nullable().optional().openapi({
    description: "Category slug for the transactions.",
  }),
  status: z
    .enum(["pending", "archived", "completed", "posted", "excluded"])
    .nullable()
    .optional()
    .openapi({
      description: "Status to set for the transactions.",
    }),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .nullable()
    .optional()
    .openapi({
      description: "Recurring frequency to set for the transactions.",
    }),
  internal: z.boolean().optional().openapi({
    description: "Whether the transactions are internal.",
  }),
  note: z.string().nullable().optional().openapi({
    description: "Note to set for the transactions.",
  }),
  assignedId: z.string().nullable().optional().openapi({
    description: "Assigned user ID for the transactions.",
  }),
  recurring: z.boolean().optional().openapi({
    description: "Whether the transactions are recurring.",
  }),
  tagId: z.string().nullable().optional().openapi({
    description: "Tag ID to set for the transactions.",
  }),
});

export const getSimilarTransactionsSchema = z.object({
  name: z.string().openapi({
    description: "Name of the transaction.",
    param: {
      in: "query",
    },
  }),
  categorySlug: z
    .string()
    .optional()
    .openapi({
      description: "Category slug to filter similar transactions.",
      param: {
        in: "query",
      },
    }),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .optional()
    .openapi({
      description: "Recurring frequency to filter similar transactions.",
      param: {
        in: "query",
      },
    }),
});

export const updateSimilarTransactionsCategorySchema = z.object({
  name: z.string().openapi({
    description: "Name of the transaction.",
  }),
  categorySlug: z.string().optional().openapi({
    description: "Category slug to update.",
  }),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .optional()
    .openapi({
      description: "Recurring frequency to update.",
    }),
  recurring: z.boolean().optional().openapi({
    description: "Whether the transaction is recurring.",
  }),
});

export const updateSimilarTransactionsRecurringSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Transaction ID (UUID) to update recurring status.",
      param: {
        in: "path",
        name: "id",
      },
    }),
});

export const searchTransactionMatchSchema = z.object({
  query: z
    .string()
    .optional()
    .openapi({
      description: "Search query for matching transactions.",
      param: {
        in: "query",
      },
    }),
  inboxId: z
    .string()
    .uuid()
    .optional()
    .openapi({
      description: "Inbox ID to search within.",
      param: {
        in: "query",
      },
    }),
  maxResults: z
    .number()
    .optional()
    .openapi({
      description: "Maximum number of results to return.",
      param: {
        in: "query",
      },
    }),
  minConfidenceScore: z
    .number()
    .optional()
    .openapi({
      description: "Minimum confidence score for matches.",
      param: {
        in: "query",
      },
    }),
});

export const createTransactionSchema = z.object({
  name: z.string().openapi({
    description: "Name of the transaction.",
  }),
  amount: z.number().openapi({
    description: "Amount of the transaction.",
  }),
  currency: z.string().openapi({
    description: "Currency of the transaction.",
  }),
  date: z.string().openapi({
    description: "Date of the transaction (ISO 8601).",
  }),
  bankAccountId: z.string().openapi({
    description: "Bank account ID associated with the transaction.",
  }),
  assignedId: z.string().optional().openapi({
    description: "Assigned user ID for the transaction.",
  }),
  categorySlug: z.string().optional().openapi({
    description: "Category slug for the transaction.",
  }),
  note: z.string().optional().openapi({
    description: "Note for the transaction.",
  }),
  internal: z.boolean().optional().openapi({
    description: "Whether the transaction is internal.",
  }),
  attachments: z
    .array(
      z.object({
        path: z.array(z.string()).openapi({
          description: "Path(s) of the attachment file(s).",
        }),
        name: z.string().openapi({
          description: "Name of the attachment file.",
        }),
        size: z.number().openapi({
          description: "Size of the attachment file in bytes.",
        }),
        type: z.string().openapi({
          description: "MIME type of the attachment file.",
        }),
      }),
    )
    .optional()
    .openapi({
      description: "Array of attachments for the transaction.",
    }),
});

export const createTransactionsSchema = z
  .array(createTransactionSchema)
  .max(100)
  .min(1)
  .openapi({
    description: "List of transactions to create.",
  });

export const createTransactionsResponseSchema = z.array(
  transactionResponseSchema,
);
