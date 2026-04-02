import { z } from "@hono/zod-openapi";

const createTransactionAttachmentSchema = z
  .object({
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
  })
  .openapi("CreateTransactionAttachment");

export const getTransactionsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Cursor for pagination, representing the last item from the previous page",
    )
    .openapi({
      description:
        "Cursor for pagination, representing the last item from the previous page",
      example: "eyJpZCI6IjEyMyJ9",
      param: {
        in: "query",
      },
    }),
  sort: z
    .array(z.string().min(1))
    .max(2)
    .min(2)
    .nullable()
    .optional()
    .describe(
      "Sort as [column, direction]. Columns: date, amount, name, status, attachment, assigned, bank_account, category, tags, counterparty. Direction: asc or desc.",
    )
    .openapi({
      description:
        "Sort as [column, direction]. Columns: date, amount, name, status, attachment, assigned, bank_account, category, tags, counterparty. Direction: asc or desc.",
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
    .describe("Number of transactions to return per page (1-10000)")
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
    .describe(
      "Search query to filter transactions by name, description, or other text fields",
    )
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
    .describe("Array of category slugs to filter by")
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
    .describe("Array of tag IDs to filter by")
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
    .describe("Start date (inclusive) in ISO 8601 format")
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
    .describe("End date (inclusive) in ISO 8601 format")
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
    .describe("Array of bank account IDs to filter by")
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
    .describe("Array of user IDs to filter by assigned team members")
    .openapi({
      description: "Array of user IDs to filter transactions by assigned users",
      example: ["user-1", "user-2"],
      param: {
        in: "query",
      },
    }),
  statuses: z
    .array(
      z.enum([
        "blank",
        "receipt_match",
        "in_review",
        "export_error",
        "exported",
        "excluded",
        "archived",
      ]),
    )
    .nullable()
    .optional()
    .describe(
      "UI list filter statuses: blank (no receipt), receipt_match (receipt attached), in_review (needs review), export_error, exported, excluded, archived. These differ from workflow statuses used in transaction updates.",
    )
    .openapi({
      description:
        "Array of transaction list status filters. Supported UI filters: 'blank', 'receipt_match', 'in_review', 'export_error', 'exported', 'excluded', 'archived'",
      example: ["in_review", "export_error"],
      param: {
        in: "query",
      },
    }),
  recurring: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by recurring frequency: weekly, monthly, annually, irregular",
    )
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
    .describe(
      "Filter by attachment presence: include (with attachments) or exclude (without)",
    )
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
    .describe("Amount range as [min, max] to filter by monetary value")
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
    .describe(
      'Array of exact amounts as strings to match (e.g. ["150.75", "299.99"])',
    )
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
    .describe(
      "Filter by type: income (money received) or expense (money spent)",
    )
    .openapi({
      description:
        "Filter by transaction type. 'income' for money received, 'expense' for money spent",
      example: "expense",
      param: {
        in: "query",
      },
    }),
  manual: z
    .enum(["include", "exclude"])
    .nullable()
    .optional()
    .openapi({
      description:
        "Filter transactions based on whether they were manually imported. 'include' returns only manual transactions, 'exclude' returns only non-manual transactions",
      example: "include",
      param: {
        in: "query",
      },
    }),
  exported: z
    .boolean()
    .nullable()
    .optional()
    .openapi({
      description:
        "Filter by export status. true = only exported transactions, false = only NOT exported transactions, undefined = no filter",
      example: false,
      param: {
        in: "query",
      },
    }),
  fulfilled: z
    .boolean()
    .nullable()
    .optional()
    .openapi({
      description:
        "Filter by fulfillment status. true = transactions ready for review (has attachments OR status=completed), false = not ready, undefined = no filter",
      example: true,
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
        name: z.string().nullable().openapi({
          description: "Display name of the bank account",
          example: "Company Credit Card",
        }),
        currency: z.string().nullable().openapi({
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
          .nullable()
          .openapi({
            description:
              "Bank connection information associated with the account. Null for manual accounts.",
            example: {
              id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
              name: "Chase Bank",
              logoUrl: "https://cdn.midday.ai/logos/chase-bank.png",
            },
          }),
      })
      .nullable()
      .openapi({
        description:
          "Bank account information associated with the transaction. Null when no account is linked.",
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
  .max(1000)
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
  name: z.string().optional().openapi({
    description: "Name/description of the transaction.",
  }),
  amount: z.number().optional().openapi({
    description: "Amount of the transaction.",
  }),
  currency: z.string().optional().openapi({
    description: "Currency of the transaction.",
  }),
  date: z.string().optional().openapi({
    description: "Date of the transaction (ISO 8601).",
  }),
  bankAccountId: z.string().optional().openapi({
    description: "Bank account ID associated with the transaction.",
  }),
  categorySlug: z.string().nullable().optional().openapi({
    description: "Category slug for the transaction.",
  }),
  status: z
    .enum([
      "pending",
      "archived",
      "completed",
      "posted",
      "excluded",
      "exported",
    ])
    .nullable()
    .optional()
    .describe(
      "Workflow status for the transaction. These differ from the list filter statuses.",
    )
    .openapi({
      description: "Status of the transaction.",
    }),
  internal: z
    .boolean()
    .optional()
    .describe("Whether the transaction is between own accounts")
    .openapi({
      description: "Whether the transaction is internal.",
    }),
  recurring: z
    .boolean()
    .optional()
    .describe("Whether the transaction recurs on a schedule")
    .openapi({
      description: "Whether the transaction is recurring.",
    }),
  frequency: z
    .enum(["weekly", "monthly", "annually", "irregular"])
    .nullable()
    .optional()
    .describe("Recurring frequency if recurring is true")
    .openapi({
      description: "Recurring frequency of the transaction.",
    }),
  note: z
    .string()
    .nullable()
    .optional()
    .describe("Free-text note or memo")
    .openapi({
      description: "Note for the transaction.",
    }),
  assignedId: z
    .string()
    .nullable()
    .optional()
    .describe("Team member user ID to assign this transaction to")
    .openapi({
      description: "Assigned user ID for the transaction.",
    }),
  taxRate: z
    .number()
    .nullable()
    .optional()
    .describe("Tax rate as a percentage (e.g. 25 for 25% VAT)")
    .openapi({
      description:
        "Tax rate as a percentage (e.g., 25 for 25% VAT). Only set when tax is calculated from a percentage.",
    }),
  taxAmount: z
    .number()
    .nullable()
    .optional()
    .describe("Tax amount in the transaction currency")
    .openapi({
      description:
        "Tax amount in the transaction currency. Always set when tax is present.",
    }),
});

export const updateTransactionsSchema = z.object({
  ids: z
    .array(z.string())
    .describe("Array of transaction IDs to update")
    .openapi({
      description: "Array of transaction IDs to update.",
    }),
  categorySlug: z
    .string()
    .nullable()
    .optional()
    .describe("Category slug to assign")
    .openapi({
      description: "Category slug for the transactions.",
    }),
  status: z
    .enum([
      "pending",
      "archived",
      "completed",
      "posted",
      "excluded",
      "exported",
    ])
    .nullable()
    .optional()
    .describe(
      "Workflow status to set. These differ from the list filter statuses.",
    )
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
  transactionId: z.string().uuid().optional().openapi({
    description: "Transaction ID to exclude from results.",
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
  includeAlreadyMatched: z
    .boolean()
    .optional()
    .openapi({
      description: "Whether to include already matched transactions.",
      param: {
        in: "query",
      },
    }),
});

export const createTransactionSchema = z.object({
  name: z.string().describe("Transaction name or description").openapi({
    description: "Name of the transaction.",
  }),
  amount: z
    .number()
    .describe("Transaction amount (positive for income, negative for expense)")
    .openapi({
      description: "Amount of the transaction.",
    }),
  currency: z
    .string()
    .describe("Currency code (ISO 4217, e.g. USD, EUR)")
    .openapi({
      description: "Currency of the transaction.",
    }),
  date: z.string().describe("Transaction date (ISO 8601)").openapi({
    description: "Date of the transaction (ISO 8601).",
  }),
  bankAccountId: z
    .string()
    .describe("Bank account ID to associate with")
    .openapi({
      description: "Bank account ID associated with the transaction.",
    }),
  assignedId: z
    .string()
    .optional()
    .describe("Team member user ID to assign to")
    .openapi({
      description: "Assigned user ID for the transaction.",
    }),
  categorySlug: z
    .string()
    .optional()
    .describe("Category slug to assign")
    .openapi({
      description: "Category slug for the transaction.",
    }),
  note: z.string().optional().describe("Free-text note or memo").openapi({
    description: "Note for the transaction.",
  }),
  internal: z
    .boolean()
    .optional()
    .describe("Whether this is between own accounts")
    .openapi({
      description: "Whether the transaction is internal.",
    }),
  attachments: z.array(createTransactionAttachmentSchema).optional().openapi({
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

export const getTransactionAttachmentPreSignedUrlSchema = z.object({
  transactionId: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier of the transaction",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "path",
        name: "transactionId",
      },
    }),
  attachmentId: z
    .string()
    .uuid()
    .openapi({
      description:
        "Unique identifier of the attachment to generate a pre-signed URL for",
      example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
      param: {
        in: "path",
        name: "attachmentId",
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

export const transactionAttachmentPreSignedUrlResponseSchema = z.object({
  url: z.string().url().openapi({
    description:
      "Pre-signed URL for accessing the attachment, valid for 60 seconds",
    example:
      "https://service.midday.ai/storage/v1/object/sign/vault/transactions/receipt.pdf?token=abc123&expires=1640995200",
  }),
  expiresAt: z.string().datetime().openapi({
    description: "ISO 8601 timestamp when the URL expires",
    example: "2024-04-15T10:01:00.000Z",
  }),
  fileName: z.string().nullable().openapi({
    description: "Original filename of the attachment",
    example: "receipt.pdf",
  }),
});

export const createTransactionsResponseSchema = z.array(
  transactionResponseSchema,
);

export const exportTransactionsSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional().default("en"),
  exportSettings: z
    .object({
      csvDelimiter: z.string(),
      includeCSV: z.boolean(),
      includeXLSX: z.boolean(),
      sendEmail: z.boolean(),
      sendCopyToMe: z.boolean().optional(),
      accountantEmail: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate email if sendEmail is true
        if (data.sendEmail) {
          if (!data.accountantEmail || data.accountantEmail.trim() === "") {
            return false;
          }
          return z.string().email().safeParse(data.accountantEmail.trim())
            .success;
        }
        return true;
      },
      {
        message: "Invalid email address",
        path: ["accountantEmail"],
      },
    )
    .optional(),
});

export const importTransactionsSchema = z.object({
  filePath: z.array(z.string()).optional(),
  bankAccountId: z.string().uuid(),
  currency: z.string(),
  currentBalance: z.string().optional(),
  inverted: z.boolean(),
  mappings: z
    .object({
      amount: z.string(),
      date: z.string(),
      description: z.string().optional(),
      counterparty: z.string().optional(),
      balance: z.string().optional(),
    })
    .refine((mappings) => !!mappings.description || !!mappings.counterparty, {
      message: "Either description or counterparty mapping is required",
      path: ["description"],
    }),
});

export const generateCsvMappingSchema = z.object({
  fieldColumns: z.array(z.string()).min(1),
  firstRows: z.array(z.record(z.string(), z.string())).min(1),
});

export const generateCsvMappingResponseSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  counterparty: z.string().optional(),
  amount: z.string().optional(),
  balance: z.string().optional(),
  currency: z.string().optional(),
});

export const moveToReviewSchema = z.object({
  transactionId: z.string().uuid().openapi({
    description: "Transaction ID to move back to review.",
  }),
});
