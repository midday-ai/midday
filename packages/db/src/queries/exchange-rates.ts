import type { Database } from "@db/client";
import { exchangeRates } from "@db/schema";
import { and, eq, sql } from "drizzle-orm";

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
