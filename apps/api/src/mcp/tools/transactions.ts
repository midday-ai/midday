import {
  getTransactionByIdSchema,
  getTransactionsSchema,
} from "@api/schemas/transactions";
import { getTransactionById, getTransactions } from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerTransactionTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "transactions.read")) {
    return;
  }

  server.registerTool(
    "transactions_list",
    {
      title: "List Transactions",
      description:
        "List bank transactions with filtering by date range, amount, category, status, account, tags, and free-text search. Returns paginated results (default 25 per page). Use cursor from the response to fetch the next page. For quick lookups across all data types, prefer search_global instead.",
      inputSchema: getTransactionsSchema.shape,
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
        hasMore: z.boolean(),
        cursor: z.string().nullable().optional(),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
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
        sort: params.sort ?? null,
        tags: params.tags ?? null,
        assignees: params.assignees ?? null,
        recurring: params.recurring ?? null,
        attachments: params.attachments ?? null,
        amountRange: params.amountRange ?? null,
        amount: params.amount ?? null,
        manual: params.manual ?? null,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
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

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: { data: result },
      };
    },
  );
};
