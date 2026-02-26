import type { Database } from "@db/client";
import { merchants, dealStatusEnum, deals } from "@db/schema";
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
      totalRevenue: sql<number>`SUM(${deals.amount})::float`,
      currency: deals.currency,
      dealCount: sql<number>`COUNT(${deals.id})::int`,
    })
    .from(merchants)
    .innerJoin(
      deals,
      and(
        eq(deals.merchantId, merchants.id),
        gte(deals.createdAt, thirtyDaysAgo.toISOString()),
        inArray(deals.status, ["paid", "unpaid", "overdue"]), // Exclude drafts
      ),
    )
    .where(eq(merchants.teamId, teamId))
    .groupBy(merchants.id, merchants.name, deals.currency)
    .orderBy(sql`SUM(${deals.amount}) DESC`)
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
      totalRevenue: sql<number>`COALESCE(SUM(${deals.amount}), 0)::float`,
      dealCount: sql<number>`COUNT(${deals.id})::int`,
      firstDealDate: sql<string>`MIN(${deals.createdAt})`,
      lastDealDate: sql<string>`MAX(${deals.createdAt})`,
      currency: deals.currency,
    })
    .from(merchants)
    .leftJoin(
      deals,
      and(
        eq(deals.merchantId, merchants.id),
        inArray(deals.status, ["paid", "unpaid", "overdue"]), // Exclude drafts
        currency ? eq(deals.currency, currency) : sql`true`,
      ),
    )
    .where(eq(merchants.teamId, teamId))
    .groupBy(
      merchants.id,
      merchants.name,
      merchants.createdAt,
      deals.currency,
    )
    .having(sql`COUNT(${deals.id}) > 0`); // Only merchants with deals

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
    const lastDeal = parseISO(merchant.lastDealDate);
    const firstDeal = parseISO(merchant.firstDealDate);

    // Calculate lifespan (from first deal to last deal or now)
    const lifespanMs = lastDeal.getTime() - firstDeal.getTime();
    const lifespanDays = Math.max(
      1,
      Math.floor(lifespanMs / (1000 * 60 * 60 * 24)),
    );

    // Is merchant active? (deal in last 30 days)
    const isActive = lastDeal >= thirtyDaysAgo;

    return {
      merchantId: merchant.merchantId,
      merchantName: merchant.merchantName,
      totalRevenue: merchant.totalRevenue,
      dealCount: merchant.dealCount,
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
      dealCount: c.dealCount,
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
