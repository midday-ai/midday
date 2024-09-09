import { cronTrigger } from "@trigger.dev/sdk";
import { client, supabase } from "../client";
import { Jobs } from "../constants";
import { engine } from "../utils/engine";
import { processBatch } from "../utils/process";

client.defineJob({
  id: Jobs.EXCHANGE_RATES_UPDATE,
  name: "Exchange Rates - Update",
  version: "0.1.2",
  trigger: cronTrigger({
    cron: "0 12 * * *",
  }),
  integrations: {
    supabase,
  },
  run: async (_, io) => {
    const rates = await engine.rates.list();

    const data = rates.data.flatMap((rate) => {
      return Object.entries(rate.rates).map(([target, value]) => ({
        base: rate.source,
        target: target,
        rate: value,
        updated_at: rate.date,
      }));
    });

    await io.logger.info("Updating exchange rates", { data });

    await processBatch(data, 500, async (batch) => {
      await io.supabase.client.from("exchange_rates").upsert(batch, {
        onConflict: "base, target",
        ignoreDuplicates: false,
      });
    });
  },
});
