import type { Database } from "@db/client";
import { merchants, invoiceStatusEnum, invoices } from "@db/schema";
import { parseISO } from "date-fns";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";

export type GetTopRevenueMerchantParams = {
  teamId: string;
};

export async function getTopRevenueMerchant(
  db: Database,
  params: GetTopRevenueMerchantParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      merchantId: merchants.id,
      merchantName: merchants.name,
      totalRevenue: sql<number>`SUM(${invoices.amount})::float`,
      currency: invoices.currency,
      invoiceCount: sql<number>`COUNT(${invoices.id})::int`,
    })
    .from(merchants)
    .innerJoin(
      invoices,
      and(
        eq(invoices.merchantId, merchants.id),
        gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
        inArray(invoices.status, ["paid", "unpaid", "overdue"]), // Exclude drafts
      ),
    )
    .where(eq(merchants.teamId, teamId))
    .groupBy(merchants.id, merchants.name, invoices.currency)
    .orderBy(sql`SUM(${invoices.amount}) DESC`)
    .limit(1);

  return result[0] || null;
}

export type GetNewMerchantsCountParams = {
  teamId: string;
};

export async function getNewMerchantsCount(
  db: Database,
  params: GetNewMerchantsCountParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(merchants)
    .where(
      and(
        eq(merchants.teamId, teamId),
        gte(merchants.createdAt, thirtyDaysAgo.toISOString()),
      ),
    );

  return result?.count || 0;
}

export type GetMerchantLifetimeValueParams = {
  teamId: string;
  currency?: string;
};

export async function getMerchantLifetimeValue(
  db: Database,
  params: GetMerchantLifetimeValueParams,
) {
  const { teamId, currency } = params;

  // Get all merchants with their lifetime value
  const merchantValues = await db
    .select({
      merchantId: merchants.id,
      merchantName: merchants.name,
      merchantCreatedAt: merchants.createdAt,
      totalRevenue: sql<number>`COALESCE(SUM(${invoices.amount}), 0)::float`,
      invoiceCount: sql<number>`COUNT(${invoices.id})::int`,
      firstInvoiceDate: sql<string>`MIN(${invoices.createdAt})`,
      lastInvoiceDate: sql<string>`MAX(${invoices.createdAt})`,
      currency: invoices.currency,
    })
    .from(merchants)
    .leftJoin(
      invoices,
      and(
        eq(invoices.merchantId, merchants.id),
        inArray(invoices.status, ["paid", "unpaid", "overdue"]), // Exclude drafts
        currency ? eq(invoices.currency, currency) : sql`true`,
      ),
    )
    .where(eq(merchants.teamId, teamId))
    .groupBy(
      merchants.id,
      merchants.name,
      merchants.createdAt,
      invoices.currency,
    )
    .having(sql`COUNT(${invoices.id}) > 0`); // Only merchants with invoices

  if (merchantValues.length === 0) {
    return {
      summary: {
        averageCLV: 0,
        medianCLV: 0,
        totalMerchants: 0,
        activeMerchants: 0,
        averageLifespanDays: 0,
        currency: currency || "USD",
      },
      topMerchants: [],
      meta: {
        type: "merchant_lifetime_value",
        currency: currency || "USD",
      },
    };
  }

  // Calculate merchant lifespans and active status
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const merchantsWithMetrics = merchantValues.map((merchant) => {
    const lastInvoice = parseISO(merchant.lastInvoiceDate);
    const firstInvoice = parseISO(merchant.firstInvoiceDate);

    // Calculate lifespan (from first invoice to last invoice or now)
    const lifespanMs = lastInvoice.getTime() - firstInvoice.getTime();
    const lifespanDays = Math.max(
      1,
      Math.floor(lifespanMs / (1000 * 60 * 60 * 24)),
    );

    // Is merchant active? (invoice in last 30 days)
    const isActive = lastInvoice >= thirtyDaysAgo;

    return {
      merchantId: merchant.merchantId,
      merchantName: merchant.merchantName,
      totalRevenue: merchant.totalRevenue,
      invoiceCount: merchant.invoiceCount,
      lifespanDays,
      isActive,
      currency: merchant.currency || currency || "USD",
    };
  });

  // Calculate summary statistics
  const totalRevenue = merchantsWithMetrics.reduce(
    (sum, c) => sum + c.totalRevenue,
    0,
  );
  const totalMerchants = merchantsWithMetrics.length;
  const activeMerchants = merchantsWithMetrics.filter(
    (c) => c.isActive,
  ).length;

  const averageCLV = totalRevenue / totalMerchants;

  // Calculate median CLV
  const sortedValues = merchantsWithMetrics
    .map((c) => c.totalRevenue)
    .sort((a, b) => a - b);
  const medianCLV =
    sortedValues.length % 2 === 0
      ? ((sortedValues[sortedValues.length / 2 - 1] ?? 0) +
          (sortedValues[sortedValues.length / 2] ?? 0)) /
        2
      : (sortedValues[Math.floor(sortedValues.length / 2)] ?? 0);

  // Average lifespan
  const averageLifespanDays =
    merchantsWithMetrics.reduce((sum, c) => sum + c.lifespanDays, 0) /
    totalMerchants;

  // Get top 5 merchants by CLV
  const topMerchants = merchantsWithMetrics
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map((c) => ({
      merchantId: c.merchantId,
      merchantName: c.merchantName,
      lifetimeValue: Number(c.totalRevenue.toFixed(2)),
      invoiceCount: c.invoiceCount,
      lifespanDays: c.lifespanDays,
      isActive: c.isActive,
      currency: c.currency,
    }));

  const mainCurrency = merchantValues[0]?.currency || currency || "USD";

  return {
    summary: {
      averageCLV: Number(averageCLV.toFixed(2)),
      medianCLV: Number((medianCLV ?? 0).toFixed(2)),
      totalMerchants,
      activeMerchants,
      averageLifespanDays: Math.round(averageLifespanDays),
      currency: mainCurrency,
    },
    topMerchants,
    meta: {
      type: "merchant_lifetime_value",
      currency: mainCurrency,
    },
  };
}
