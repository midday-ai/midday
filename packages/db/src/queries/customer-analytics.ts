import type { Database } from "@db/client";
import { customers, invoiceStatusEnum, invoices } from "@db/schema";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";

export type GetTopRevenueClientParams = {
  teamId: string;
};

export async function getTopRevenueClient(
  db: Database,
  params: GetTopRevenueClientParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      totalRevenue: sql<number>`SUM(${invoices.amount})::float`,
      currency: invoices.currency,
      invoiceCount: sql<number>`COUNT(${invoices.id})::int`,
    })
    .from(customers)
    .innerJoin(
      invoices,
      and(
        eq(invoices.customerId, customers.id),
        gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
        inArray(invoices.status, ["paid", "unpaid", "overdue"]), // Exclude drafts
      ),
    )
    .where(eq(customers.teamId, teamId))
    .groupBy(customers.id, customers.name, invoices.currency)
    .orderBy(sql`SUM(${invoices.amount}) DESC`)
    .limit(1);

  return result[0] || null;
}

export type GetNewCustomersCountParams = {
  teamId: string;
};

export async function getNewCustomersCount(
  db: Database,
  params: GetNewCustomersCountParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(customers)
    .where(
      and(
        eq(customers.teamId, teamId),
        gte(customers.createdAt, thirtyDaysAgo.toISOString()),
      ),
    );

  return result?.count || 0;
}
