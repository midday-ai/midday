import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const BATCH_LIMIT = 300;

client.defineJob({
  id: Jobs.TRANSACTIONS_UPDATE_BASE_CURRENCY,
  name: "Transactions - Update Base Currency",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_UPDATE_BASE_CURRENCY,
    schema: z.object({
      teamId: z.string(),
      currency: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = io.supabase.client;

    const { teamId, currency } = payload;

    const { data: exchangeRates } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("currency", currency)
      .single();

    if (!exchangeRates) {
      return;
    }

    // revalidateTag(`bank_connections_${teamId}`);
    // revalidateTag(`transactions_${teamId}`);
    // revalidateTag(`spending_${teamId}`);
    // revalidateTag(`metrics_${teamId}`);
    // revalidateTag(`bank_accounts_${teamId}`);
    // revalidateTag(`insights_${teamId}`);

    return;
  },
});
