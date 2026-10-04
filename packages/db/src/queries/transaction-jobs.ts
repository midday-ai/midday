import { and, eq, gte, sql } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../client";
import { transactionAttachments, transactions } from "../schema";

// Share fulfillment semantics between transaction filtering and invoice matching.
export const transactionIsFulfilled = (teamId: string) => sql`(
  EXISTS (
    SELECT 1 FROM ${transactionAttachments}
    WHERE ${transactionAttachments.transactionId} = ${transactions.id}
      AND ${transactionAttachments.teamId} = ${teamId}
  ) OR ${transactions.status} = 'completed'
)`;

export async function markTransactionsNotified(
  db: DatabaseOrTransaction,
  { teamId }: { teamId: string },
) {
  const rows = await db
    .update(transactions)
    .set({ notified: true })
    .where(
      and(eq(transactions.teamId, teamId), eq(transactions.notified, false)),
    )
    .returning({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      name: transactions.name,
      currency: transactions.currency,
      categorySlug: transactions.categorySlug,
      status: transactions.status,
    });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export async function findUnfulfilledTransactionsForInvoice(
  db: DatabaseOrTransaction,
  params: { teamId: string; amount: number; currency: string; since: string },
) {
  return db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.teamId, params.teamId),
        eq(transactions.amount, params.amount),
        eq(transactions.currency, params.currency.toUpperCase()),
        gte(transactions.date, params.since),
        sql`NOT (${transactionIsFulfilled(params.teamId)})`,
      ),
    );
}

// Invoice matching should not reset exports or emit user-upload activity.
export async function createTransactionAttachment(
  db: DatabaseOrTransaction,
  params: {
    teamId: string;
    transactionId: string;
    type: string;
    name: string;
    size: number | null;
    path: string[] | null;
  },
) {
  // INSERT .. SELECT atomically binds the attachment to its transaction's team.
  const [row] = await db
    .insert(transactionAttachments)
    .select(
      db
        .select({
          id: sql<string>`gen_random_uuid()`.as("id"),
          createdAt: sql<string>`now()`.as("created_at"),
          type: sql<string>`${params.type}::text`.as("type"),
          transactionId: transactions.id,
          teamId: transactions.teamId,
          size: sql<number | null>`${params.size}::bigint`.as("size"),
          name: sql<string>`${params.name}::text`.as("name"),
          path: sql<
            string[] | null
          >`${sql.param(params.path, transactionAttachments.path)}::text[]`.as(
            "path",
          ),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.id, params.transactionId),
            eq(transactions.teamId, params.teamId),
          ),
        ),
    )
    .returning();
  return row;
}
