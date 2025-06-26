import { upsertExchangeRates } from "@midday/db/queries";
import { client } from "@midday/engine-client";
import { job } from "@worker/core/job";
import { systemQueue } from "@worker/queues/queues";
import { z } from "zod";

export const updateRatesJob = job(
  "update-rates",
  z.any(),
  {
    queue: systemQueue,
    attempts: 3,
    removeOnComplete: 10,
    removeOnFail: 10,
  },
  async (_, ctx) => {
    ctx.logger.info("Starting exchange rates update");

    // Fetch rates from engine client
    const ratesResponse = await client.rates.$get();

    if (!ratesResponse.ok) {
      ctx.logger.error("Failed to get rates from engine client");
      throw new Error("Failed to get rates");
    }

    const { data: ratesData } = await ratesResponse.json();

    // Transform data to match our schema
    const exchangeRateData = ratesData.flatMap((rate) => {
      return Object.entries(rate.rates).map(([target, value]) => ({
        base: rate.source,
        target: target,
        rate: value,
        updatedAt: rate.date,
      }));
    });

    ctx.logger.info(`Processing ${exchangeRateData.length} exchange rates`);

    try {
      // Use the database query function with progress tracking
      const batchSize = 1000;
      let processed = 0;

      for (let i = 0; i < exchangeRateData.length; i += batchSize) {
        const batch = exchangeRateData.slice(i, i + batchSize);

        await upsertExchangeRates(ctx.db, { rates: batch });

        processed += batch.length;
        const progress = Math.round(
          (processed / exchangeRateData.length) * 100,
        );

        await ctx.job.updateProgress(progress);

        ctx.logger.info(
          `Processed batch ${Math.ceil((i + 1) / batchSize)}, total: ${processed}/${exchangeRateData.length}`,
        );
      }

      ctx.logger.info(`Successfully updated ${processed} exchange rates`);

      return {
        type: "rates-updated",
        totalRates: processed,
        updatedAt: new Date(),
      };
    } catch (error) {
      ctx.logger.error("Failed to update exchange rates", { error });
      throw error;
    }
  },
);
