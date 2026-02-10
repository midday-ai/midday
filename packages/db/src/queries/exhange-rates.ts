import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../client";
import { exchangeRates } from "../schema";

export type ExchangeRateData = {
  base: string;
  target: string;
  rate: number;
  updatedAt: string;
};

export type UpsertExchangeRatesParams = {
  rates: ExchangeRateData[];
  batchSize?: number;
};

export type UpsertExchangeRatesBatchParams = {
  rates: ExchangeRateData[];
};

export const upsertExchangeRates = async (
  db: Database,
  params: UpsertExchangeRatesParams,
) => {
  const { rates, batchSize = 1000 } = params;

  if (rates.length === 0) {
    return { totalProcessed: 0, batchesProcessed: 0 };
  }

  let totalProcessed = 0;
  let batchesProcessed = 0;

  for (let i = 0; i < rates.length; i += batchSize) {
    const batch = rates.slice(i, i + batchSize);

    await db.transaction(async (tx) => {
      await tx
        .insert(exchangeRates)
        .values(batch)
        .onConflictDoUpdate({
          target: [exchangeRates.base, exchangeRates.target],
          set: {
            rate: sql`excluded.rate`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    });

    totalProcessed += batch.length;
    batchesProcessed += 1;
  }

  return {
    totalProcessed,
    batchesProcessed,
  };
};

export type GetExchangeRateParams = {
  base: string;
  target: string;
};

export async function getExchangeRate(
  db: Database,
  params: GetExchangeRateParams,
) {
  const { base, target } = params;

  const [result] = await db
    .select({
      rate: exchangeRates.rate,
    })
    .from(exchangeRates)
    .where(and(eq(exchangeRates.base, base), eq(exchangeRates.target, target)))
    .limit(1);

  return result;
}

export type GetExchangeRatesBatchParams = {
  pairs: Array<{ base: string; target: string }>;
};

export async function getExchangeRatesBatch(
  db: Database,
  params: GetExchangeRatesBatchParams,
) {
  const { pairs } = params;

  if (pairs.length === 0) {
    return new Map<string, number>();
  }

  // Extract unique base and target currencies
  const baseCurrencies = [...new Set(pairs.map((p) => p.base))];
  const targetCurrencies = [...new Set(pairs.map((p) => p.target))];

  // Fetch all exchange rates in one query
  // Filter to only the exact pairs we need
  const results = await db
    .select({
      base: exchangeRates.base,
      target: exchangeRates.target,
      rate: exchangeRates.rate,
    })
    .from(exchangeRates)
    .where(
      and(
        inArray(exchangeRates.base, baseCurrencies),
        inArray(exchangeRates.target, targetCurrencies),
      ),
    );

  // Filter results to only include exact pairs we requested
  const pairSet = new Set(pairs.map((p) => `${p.base}-${p.target}`));

  // Build a map for O(1) lookup, only including requested pairs
  const rateMap = new Map<string, number>();
  for (const result of results) {
    if (result.base && result.target && result.rate) {
      const key = `${result.base}-${result.target}`;
      if (pairSet.has(key)) {
        rateMap.set(key, Number(result.rate));
      }
    }
  }

  return rateMap;
}
