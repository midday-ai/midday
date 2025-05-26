import { z } from "@hono/zod-openapi";

export const getTransactionsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .openapi({
      description:
        "A cursor for pagination, representing the last item from the previous page.",
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
        "Sorting order as a tuple: [field, direction]. Example: ['date', 'desc'].",
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
      description: "Number of transactions to return per page (1-100).",
      param: {
        in: "query",
      },
    }),
  filter: z
    .object({
      q: z
        .string()
        .nullable()
        .optional()
        .openapi({
          description: "Search query string to filter transactions by text.",
          param: {
            in: "query",
          },
        }),
      categories: z
        .array(z.string())
        .nullable()
        .optional()
        .openapi({
          description: "List of category slugs to filter transactions.",
          param: {
            in: "query",
          },
        }),
      tags: z
        .array(z.string())
        .nullable()
        .optional()
        .openapi({
          description: "List of tag IDs to filter transactions.",
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
            "Start date (inclusive) for filtering transactions, in ISO 8601 format.",
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
            "End date (inclusive) for filtering transactions, in ISO 8601 format.",
          param: {
            in: "query",
          },
        }),
      accounts: z
        .array(z.string())
        .nullable()
        .optional()
        .openapi({
          description: "List of account IDs to filter transactions.",
          param: {
            in: "query",
          },
        }),
      assignees: z
        .array(z.string())
        .nullable()
        .optional()
        .openapi({
          description: "List of user IDs assigned to transactions.",
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
            "List of transaction statuses to filter by (e.g., 'pending', 'completed').",
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
            "List of recurring frequency values to filter by (e.g., 'monthly').",
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
            "Whether to include or exclude transactions with attachments.",
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
            "Amount range as [min, max] to filter transactions by value.",
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
            "List of specific amounts (as strings) to filter transactions.",
          param: {
            in: "query",
          },
        }),
      type: z
        .enum(["income", "expense"])
        .nullable()
        .optional()
        .openapi({
          description: "Transaction type: 'income' or 'expense'.",
          param: {
            in: "query",
          },
        }),
    })
    .optional()
    .openapi({
      description:
        "Object containing various filters for querying transactions.",
      param: {
        in: "query",
      },
    }),
});

export const transactionResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the transaction.",
      example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    }),
    name: z.string().openapi({
      description: "The name or description of the transaction.",
      example: "Office Supplies Purchase",
    }),
    amount: z.number().openapi({
      description: "The amount of the transaction.",
      example: 150.75,
    }),
    currency: z.string().openapi({
      description: "The currency code of the transaction.",
      example: "USD",
    }),
    date: z.string().openapi({
      description: "The date of the transaction in ISO 8601 format.",
      example: "2024-05-01T12:00:00Z",
    }),
    category: z
      .object({
        id: z.string().openapi({
          description: "The unique identifier of the category.",
          example: "office-supplies",
        }),
        name: z.string().openapi({
          description: "The display name of the category.",
          example: "Office Supplies",
        }),
        color: z.string().openapi({
          description: "The color associated with the category.",
          example: "#FF5733",
        }),
        slug: z.string().openapi({
          description: "The slug of the category.",
          example: "office-supplies",
        }),
      })
      .nullable()
      .openapi({
        description: "The category assigned to the transaction.",
        example: {
          id: "office-supplies",
          name: "Office Supplies",
          color: "#FF5733",
          slug: "office-supplies",
        },
      }),
    status: z.string().openapi({
      description: "The status of the transaction.",
      example: "completed",
    }),
    internal: z.boolean().nullable().openapi({
      description: "Whether the transaction is internal.",
      example: false,
    }),
    recurring: z.boolean().nullable().openapi({
      description: "Whether the transaction is recurring.",
      example: false,
    }),
    manual: z.boolean().nullable().openapi({
      description:
        "Whether the transaction was created manually (API/Form) rather than via bank connections.",
      example: false,
    }),
    frequency: z.string().nullable().openapi({
      description: "The frequency of the recurring transaction, if applicable.",
      example: "monthly",
    }),
    isFulfilled: z.boolean().openapi({
      description: "Whether the transaction is fulfilled.",
      example: true,
    }),
    note: z.string().nullable().openapi({
      description: "An optional note attached to the transaction.",
      example: "Paid by company card.",
    }),
    account: z
      .object({
        id: z.string().openapi({
          description: "Bank account ID (UUID).",
          example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
        }),
        name: z.string().openapi({
          description: "Name of the bank account.",
          example: "Company Card",
        }),
        currency: z.string().openapi({
          description: "Currency of the bank account.",
          example: "USD",
        }),
        connection: z
          .object({
            id: z.string().openapi({
              description: "Bank connection ID (UUID).",
              example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
            }),
            name: z.string().openapi({
              description: "Name of the bank institution.",
              example: "Company Card",
            }),
            logoUrl: z.string().nullable().openapi({
              description: "Logo URL of the bank institution.",
              example: "https://example.com/logo.png",
            }),
          })
          .openapi({
            description: "The bank connection associated with the account.",
            example: {
              id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
              name: "Company Card",
              logoUrl: "https://example.com/logo.png",
            },
          }),
      })
      .openapi({
        description: "The bank account associated with the transaction.",
        example: {
          id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
          name: "Company Card",
          currency: "USD",
          connection: {
            id: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
            name: "Company Card",
            logoUrl: "https://example.com/logo.png",
          },
        },
      }),
    tags: z
      .array(
        z.object({
          id: z.string().openapi({
            description: "Tag ID (UUID).",
            example: "b7e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7b",
          }),
          name: z.string().nullable().openapi({
            description: "Name of the tag.",
            example: "invoice",
          }),
        }),
      )
      .nullable()
      .openapi({
        description: "List of tags associated with the transaction.",
        example: [
          { id: "b7e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7b", name: "invoice" },
          { id: "c8e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7c", name: "travel" },
        ],
      }),
    attachments: z
      .array(
        z.object({
          id: z.string().openapi({
            description: "Attachment ID (UUID).",
            example: "a43dc3a5-6925-4d91-ac9c-4c1a34bdb388",
          }),
          path: z.array(z.string()).openapi({
            description: "Path segments for the attachment file.",
            example: [
              "dd6a039e-d071-423a-9a4d-9ba71325d890",
              "transactions",
              "1d2c3753-79d7-45b0-9c40-60f482bac8e8",
              "img_2808-2.heic",
            ],
          }),
          size: z.number().openapi({
            description: "Size of the attachment in bytes.",
            example: 1928716,
          }),
          type: z.string().openapi({
            description: "MIME type of the attachment.",
            example: "image/heic",
          }),
          filename: z.string().nullable().openapi({
            description: "Original filename of the attachment.",
            example: "img_2808-2.heic",
          }),
        }),
      )
      .nullable()
      .openapi({
        description: "List of attachments associated with the transaction.",
        example: [
          {
            id: "b7e2f8c1-3d4a-4e2b-9f1a-2c3d4e5f6a7b",
            path: [
              "e1f2d3c4-b5a6-7d8e-9f0a-1b2c3d4e5f6a",
              "transactions",
              "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
              "invoice.pdf",
            ],
            size: 1928716,
            type: "application/pdf",
            filename: "invoice.pdf",
          },
        ],
      }),
  })
  .openapi("TransactionResponse");

export const transactionsResponseSchema = z.object({
  meta: z.object({
    cursor: z.string().optional(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
  data: z.array(transactionResponseSchema),
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
