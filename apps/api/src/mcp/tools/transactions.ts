import {
  createTransactionSchema,
  deleteTransactionSchema,
  deleteTransactionsSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  updateTransactionSchema,
  updateTransactionsSchema,
} from "@api/schemas/transactions";
import {
  createTransaction,
  createTransactions,
  deleteTransactions,
  getTransactionById,
  getTransactions,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import { z } from "zod";
import {
  mcpTransactionDetailSchema,
  mcpTransactionSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";

export const registerTransactionTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  const hasReadScope = hasScope(ctx, "transactions.read");
  const hasWriteScope = hasScope(ctx, "transactions.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    const {
      sort: _sort,
      amountRange: _amountRange,
      pageSize: _pageSize,
      ...transactionsListFields
    } = getTransactionsSchema.shape;

    server.registerTool(
      "transactions_list",
      {
        title: "List Transactions",
        description:
          "List bank transactions with filtering by date range, amount, category, status, account, tags, and free-text search. Returns paginated results (default 25 per page). Use cursor from the response to fetch the next page. For quick lookups across all data types, prefer search_global instead.",
        inputSchema: {
          ...transactionsListFields,
          pageSize: z.coerce
            .number()
            .min(1)
            .max(100)
            .optional()
            .describe("Number of transactions per page (1-100, default 25)"),
          sortBy: z
            .enum([
              "date",
              "amount",
              "name",
              "status",
              "attachment",
              "assigned",
              "bank_account",
              "category",
              "tags",
              "counterparty",
            ])
            .optional()
            .describe("Column to sort by"),
          sortDirection: z
            .enum(["asc", "desc"])
            .optional()
            .describe("Sort direction"),
          amountMin: z.coerce
            .number()
            .optional()
            .describe(
              "Minimum absolute amount to include (e.g. 100 matches both -100 expense and +100 income)",
            ),
          amountMax: z.coerce
            .number()
            .optional()
            .describe("Maximum absolute amount to include"),
        },
        outputSchema: {
          meta: z.object({
            cursor: z.string().nullable().optional(),
            hasNextPage: z.boolean(),
            hasPreviousPage: z.boolean(),
          }),
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const sort =
          params.sortBy && params.sortDirection
            ? [params.sortBy, params.sortDirection]
            : null;

        const amountRange =
          params.amountMin != null || params.amountMax != null
            ? [
                params.amountMin ?? 0,
                params.amountMax ?? Number.MAX_SAFE_INTEGER,
              ]
            : null;

        const result = await getTransactions(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          categories: params.categories ?? null,
          statuses: params.statuses ?? null,
          type: params.type ?? null,
          accounts: params.accounts ?? null,
          sort,
          tags: params.tags ?? null,
          assignees: params.assignees ?? null,
          recurring: params.recurring ?? null,
          attachments: params.attachments ?? null,
          amountRange,
          amount: params.amount ?? null,
          manual: params.manual ?? null,
          exported: params.exported ?? undefined,
          fulfilled: params.fulfilled ?? undefined,
        });

        const clean = {
          ...result,
          data: sanitizeArray(mcpTransactionSchema, result.data ?? []),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: clean,
        };
      },
    );

    server.registerTool(
      "transactions_get",
      {
        title: "Get Transaction",
        description:
          "Get a single transaction by ID. Returns full details including amount, currency, category, merchant name, date, attachments, notes, and bank account info.",
        inputSchema: {
          id: getTransactionByIdSchema.shape.id,
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getTransactionById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Transaction not found" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpTransactionDetailSchema, result);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "transactions_create",
      {
        title: "Create Transaction",
        description:
          "Create a manual transaction (not from bank sync). Requires bank account ID, amount, currency, date, and name. Use for manual entries and adjustments.",
        inputSchema: createTransactionSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await createTransaction(db, { teamId, ...params });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to create transaction" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpTransactionSchema, result);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );

    server.registerTool(
      "transactions_create_bulk",
      {
        title: "Create Transactions (Bulk)",
        description:
          "Create up to 100 manual transactions in one request. Each item follows the same shape as transactions_create.",
        inputSchema: z.object({
          transactions: z.array(createTransactionSchema).min(1).max(100),
        }).shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ transactions: items }) => {
        const result = await createTransactions(
          db,
          items.map((item) => ({ ...item, teamId })),
        );

        const clean = sanitizeArray(mcpTransactionSchema, result ?? []);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );

    server.registerTool(
      "transactions_update",
      {
        title: "Update Transaction",
        description:
          "Update a single transaction by ID: category, status, note, assignment, amount, tax fields, etc. Use the transaction status field for workflow states (pending, posted, excluded, archived, exported, completed).",
        inputSchema: updateTransactionSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await updateTransaction(db, {
          ...params,
          teamId,
          userId,
        });

        if (!result) {
          return {
            content: [
              { type: "text", text: "Transaction not found or update failed" },
            ],
            isError: true,
          };
        }

        const clean = sanitize(mcpTransactionSchema, result);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );

    server.registerTool(
      "transactions_update_bulk",
      {
        title: "Update Transactions (Bulk)",
        description:
          "Apply the same updates to multiple transactions by ID (e.g. bulk categorize, set tag, assignee, status).",
        inputSchema: updateTransactionsSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await updateTransactions(db, {
          ...params,
          teamId,
          userId,
        });

        const clean = sanitizeArray(mcpTransactionSchema, result ?? []);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );

    server.registerTool(
      "transactions_delete",
      {
        title: "Delete Transaction",
        description:
          "Delete a single transaction. Only manually created transactions can be deleted; bank-imported rows must be excluded via status instead.",
        inputSchema: deleteTransactionSchema.shape,
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await deleteTransactions(db, { teamId, ids: [id] });

        if (result.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Transaction could not be deleted (not found or not a manual transaction)",
              },
            ],
            isError: true,
          };
        }

        const clean = sanitize(mcpTransactionSchema, result[0]);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );

    server.registerTool(
      "transactions_delete_bulk",
      {
        title: "Delete Transactions (Bulk)",
        description:
          "Delete up to 1000 manual transactions by ID. Bank-imported transactions cannot be deleted.",
        inputSchema: z.object({ ids: deleteTransactionsSchema }).shape,
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ ids }) => {
        const result = await deleteTransactions(db, { teamId, ids });

        const clean = sanitizeArray(mcpTransactionSchema, result ?? []);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      },
    );
  }
};
