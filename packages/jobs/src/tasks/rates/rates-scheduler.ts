import { processBatch } from "@jobs/utils/process-batch";
import { createClient } from "@midday/supabase/job";
import { trpc } from "@midday/trpc";
import { logger, schedules } from "@trigger.dev/sdk";

export const ratesScheduler = schedules.task({
  id: "rates-scheduler",
  cron: "0 0,12 * * *",
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createClient();

    const ratesResult = await trpc.banking.rates.query();

    const ratesData = ratesResult.data;

    if (!ratesData) {
      logger.error("Failed to get rates");
      throw new Error("Failed to get rates");
    }

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
