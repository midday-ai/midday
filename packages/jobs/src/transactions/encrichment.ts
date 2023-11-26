import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { processPromisesBatch } from "../utils";

client.defineJob({
  id: Jobs.TRANSACTIONS_ENCRICHMENT,
  name: "💅 Transactions - Enrichment",
  version: "1.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_ENCRICHMENT,
    schema: z.object({
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { teamId } = payload;

    const { data: transactionsData } = await io.supabase.client
      .from("transactions")
      .select("id, name")
      .eq("team_id", teamId)
      .is("category", null)
      .is("enrichment_id", null)
      .select();

    async function enrichTransactions(transaction) {
      const { data } = await io.supabase.client
        .rpc("search_enriched_transactions", { term: transaction.name })
        .single();

      if (data) {
        return {
          ...transaction,
          enrichment_id: data?.id ?? null,
        };
      }
    }

    const result = await processPromisesBatch(
      transactionsData,
      5,
      enrichTransactions
    );

    const filteredItems = result.filter(Boolean);

    if (filteredItems && filteredItems?.length > 0) {
      const { data: updatedTransactions } = await io.supabase.client
        .from("transactions")
        .upsert(filteredItems)
        .select();

      if (updatedTransactions && updatedTransactions?.length > 0) {
        revalidateTag(`transactions_${teamId}`);
        revalidateTag(`spending_${teamId}`);
        revalidateTag(`metrics_${teamId}`);

        await io.logger.info(
          `Transactions Enriched: ${updatedTransactions?.length}`
        );
      }
    }
  },
});
