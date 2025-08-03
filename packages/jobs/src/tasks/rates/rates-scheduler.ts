import { getDb } from "@jobs/init";
import { upsertExchangeRates } from "@midday/db/queries";
import { client } from "@midday/engine-client";
import { logger, schedules } from "@trigger.dev/sdk";

export const ratesScheduler = schedules.task({
  id: "rates-scheduler",
  cron: "0 0,12 * * *",
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const db = getDb();

    const ratesResponse = await client.rates.$get();

    if (!ratesResponse.ok) {
      logger.error("Failed to get rates");
      throw new Error("Failed to get rates");
    }

    const { data: ratesData } = await ratesResponse.json();

    const data = ratesData.flatMap((rate) => {
      return Object.entries(rate.rates).map(([target, value]) => ({
        base: rate.source,
        target: target,
        rate: value,
        updatedAt: rate.date,
      }));
    });

    await upsertExchangeRates(db, {
      rates: data,
      batchSize: 500,
    });
  },
});
