import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { EnrichmentService } from "../../utils/enrichment-service";

export const enrichTransactions = schemaTask({
  id: "enrich-transactions",
  schema: z.object({
    transactions: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ transactions }) => {
    const supabase = createClient();

    const enrichmentService = new EnrichmentService();

    const data = await enrichmentService.batchEnrichTransactions(transactions);

    // const result = await supabase.from("transactions").upsert(data);
  },
});
