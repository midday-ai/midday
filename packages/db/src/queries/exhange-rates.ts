import { eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { exchangeRates } from "../schema";

const RATE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const rateCache = new Map<
  string,
  { rates: Record<string, number>; ts: number }
>();

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

async function getRatesForTarget(
  db: Database,
  target: string,
): Promise<Record<string, number>> {
  const cached = rateCache.get(target);
  if (cached && Date.now() - cached.ts < RATE_TTL_MS) {
    return cached.rates;
  }

  const rows = await db
    .select({
      base: exchangeRates.base,
      rate: exchangeRates.rate,
    })
    .from(exchangeRates)
    .where(eq(exchangeRates.target, target));

  const rates: Record<string, number> = {};
  for (const row of rows) {
    if (row.base && row.rate) {
      rates[row.base] = Number(row.rate);
    }
  }

  rateCache.set(target, { rates, ts: Date.now() });
  return rates;
}

export async function getExchangeRate(
  db: Database,
  params: GetExchangeRateParams,
) {
  const { base, target } = params;

  if (base === target) return { rate: 1 };

  const rates = await getRatesForTarget(db, target);
  const rate = rates[base];
  return rate !== undefined ? { rate } : undefined;
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

  // Group by target currency (almost always a single target)
  const byTarget = new Map<string, string[]>();
  for (const { base, target } of pairs) {
    const list = byTarget.get(target) ?? [];
    list.push(base);
    byTarget.set(target, list);
  }

  const result = new Map<string, number>();

  for (const [target, bases] of byTarget) {
    const rates = await getRatesForTarget(db, target);
    for (const base of bases) {
      const rate = rates[base];
      if (rate !== undefined) {
        result.set(`${base}:${target}`, rate);
      }
    }
  }

  return result;
}
