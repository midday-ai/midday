import { createSchema } from "@api/utils/schema";
import { z } from "zod";
import "zod-openapi/extend";

export const getTransactionsSchema = createSchema({
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

export const transactionsSchema = createSchema({
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
  data: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        amount: z.number(),
        currency: z.string(),
        date: z.string(),
        categorySlug: z.string(),
        status: z.string(),
        internal: z.boolean(),
        recurring: z.boolean(),
        frequency: z.string(),
        note: z.string(),
        assignedId: z.string(),
        attachments: z.array(z.string()),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    )
    .openapi({
      description: "Array of transactions.",
    }),
});

export const deleteTransactionsSchema = createSchema({
  ids: z.array(z.string()).openapi({
    description: "Array of transaction IDs to delete.",
  }),
});

export const getTransactionByIdSchema = createSchema({
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

export const updateTransactionSchema = createSchema({
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

export const updateTransactionsSchema = createSchema({
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

export const getSimilarTransactionsSchema = createSchema({
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

export const updateSimilarTransactionsCategorySchema = createSchema({
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

export const updateSimilarTransactionsRecurringSchema = createSchema({
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

export const searchTransactionMatchSchema = createSchema({
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

export const createTransactionSchema = createSchema({
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
