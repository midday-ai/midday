import { z } from "zod";
import { getTransactions } from "../../queries/transactions";
import { t } from "../../strpc";
import type { TableInsert, TableRow } from "../../utils/supabase-schema";

// Export types directly from the Supabase schema
export type Transaction = TableRow<"transactions">;
export type TransactionInsert = TableInsert<"transactions">;

// Create the transactions router
export const transactionsRouter = t.router({
  // Queries
  getTransactions: t.procedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        to: z.number(),
        from: z.number().default(0),
        sort: z.tuple([z.string(), z.enum(["asc", "desc"])]).optional(),
        searchQuery: z.string().optional(),
        filter: z
          .object({
            statuses: z.array(z.string()).optional(),
            attachments: z.enum(["include", "exclude"]).optional(),
            categories: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
            accounts: z.array(z.string()).optional(),
            assignees: z.array(z.string()).optional(),
            type: z.enum(["income", "expense"]).optional(),
            start: z.string().optional(),
            end: z.string().optional(),
            recurring: z.array(z.string()).optional(),
            amount_range: z.tuple([z.number(), z.number()]).optional(),
            amount: z.tuple([z.string(), z.string()]).optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getTransactions(ctx.supabase, input);
    }),
});
