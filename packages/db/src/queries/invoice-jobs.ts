import { and, eq, inArray } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../client";
import { invoices } from "../schema";

// Cross-team scheduler helper; never exposed through a client-facing procedure.
export async function getInvoiceIdsByStatus(
  db: DatabaseOrTransaction,
  params: { statuses: (typeof invoices.$inferSelect.status)[] },
) {
  if (params.statuses.length === 0) return [];
  return db
    .select({ id: invoices.id })
    .from(invoices)
    .where(inArray(invoices.status, params.statuses));
}

// Caller must verify the invoice token and viewer before invoking this write.
export async function markInvoiceViewed(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string },
) {
  const [row] = await db
    .update(invoices)
    .set({ viewedAt: new Date().toISOString() })
    .where(and(eq(invoices.id, params.id), eq(invoices.teamId, params.teamId)))
    .returning({ id: invoices.id });
  return row;
}
