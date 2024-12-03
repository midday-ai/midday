import { client } from "@midday/engine/client";
import { createClient } from "@midday/supabase/job";
import { logger, schedules } from "@trigger.dev/sdk/v3";

export const ratesScheduler = schedules.task({
  id: "rates-scheduler",
  cron: "0 0,12 * * *",
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const ratesResponse = await client.rates.$get();

    if (!ratesResponse.ok) {
      logger.error("Failed to get rates");
      throw new Error("Failed to get rates");
    }

    const { data: ratesData } = await ratesResponse.json();

    console.log(ratesData);
  },
});
