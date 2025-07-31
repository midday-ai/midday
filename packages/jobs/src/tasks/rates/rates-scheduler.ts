import { processBatch } from "@jobs/utils/process-batch";
import { client } from "@midday/engine-client";
import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk";

export const ratesScheduler = schedules.task({
  id: "rates-scheduler",
  cron: "0 0,12 * * *",
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createClient();

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
        updated_at: rate.date,
      }));
    });

    await processBatch(data, 500, async (batch) => {
      await supabase.from("exchange_rates").upsert(batch, {
        onConflict: "base, target",
        ignoreDuplicates: false,
      });

      return batch;
    });
  },
});
