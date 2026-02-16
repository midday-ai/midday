import { upsertExchangeRates } from "@midday/db/queries";
import { trpc } from "@midday/trpc";
import type { Job } from "bullmq";
import type { RatesSchedulerPayload } from "../../schemas/rates";
import { getDb } from "../../utils/db";
import { isProduction } from "../../utils/env";
import { BaseProcessor } from "../base";

/**
 * Scheduled task that runs twice daily to update exchange rates
 * Fetches rates from the banking API and upserts them to the database
 */
export class RatesSchedulerProcessor extends BaseProcessor<RatesSchedulerPayload> {
  async process(_job: Job<RatesSchedulerPayload>): Promise<{
    totalProcessed: number;
    batchesProcessed: number;
  }> {
    // Only run in production
    if (!isProduction()) {
      this.logger.info(
        "Skipping rates scheduler in non-production environment",
      );
      return { totalProcessed: 0, batchesProcessed: 0 };
    }

    const db = getDb();

    this.logger.info("Starting rates scheduler");

    // Fetch rates from banking API
    const { data: ratesData } = await trpc.banking.rates.query();

    // Transform rates data to match database schema
    const exchangeRateData = ratesData.flatMap((rate) => {
      return Object.entries(rate.rates).map(([target, value]) => ({
        base: rate.source,
        target: target,
        rate: value,
        updatedAt: rate.date,
      }));
    });

    this.logger.info("Upserting exchange rates", {
      totalRates: exchangeRateData.length,
    });

    // Upsert rates using Drizzle ORM (handles batching internally)
    const result = await upsertExchangeRates(db, {
      rates: exchangeRateData,
      batchSize: 500, // Match original batch size
    });

    this.logger.info("Rates scheduler completed", {
      totalProcessed: result.totalProcessed,
      batchesProcessed: result.batchesProcessed,
    });

    return {
      totalProcessed: result.totalProcessed,
      batchesProcessed: result.batchesProcessed,
    };
  }
}
