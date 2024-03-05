import { Provider } from "@midday/providers";
import { client, supabase } from "../../client";
import { Jobs } from "../../constants";
import { scheduler } from "../../transactions";
import { schedulerV2 } from "./scheduler";

client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC_V2,
  name: "Transactions - Sync V2",
  version: "0.0.1",
  trigger: scheduler,
  integrations: { supabase },
  run: async (_, io, ctx) => {
    const supabase = await io.supabase.client;

    const teamId = ctx.source?.id as string;

    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, bank_connection:bank_connection_id(provider, access_token, enrollment_id)"
      )
      .eq("team_id", teamId)
      .eq("enabled", true);

    if (!accountsData?.length) {
      // NOTE: If no enabled accounts found
      // Unregister scheduler (enabled again when initial sync is runned)
      schedulerV2.unregister(teamId);
    }

    const promises = accountsData?.map(async (account) => {
      const provider = new Provider({
        provider: account.bank_connection.provider,
        // date_to: formatISO(subMonths(new Date(), 1), {
        //     representation: "date",
        //   }),
      });

      //   const transactions = await provider.getTransactions({
      //     teamId: account.team_id,
      //     accountId: account.account_id,
      //     accessToken: account.bank_connection?.access_token,
      //   });

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      // await processPromisesBatch(transactions, BATCH_LIMIT, async (batch) => {
      //   // await supabase.from("transactions").upsert(batch, {
      //   //   onConflict: "internal_id",
      //   //   ignoreDuplicates: true,
      //   // });
      // });
    });

    try {
      if (promises) {
        await Promise.all(promises);
      }
    } catch (error) {
      await io.logger.error(error);
      throw Error("Something went wrong");
    }
  },
});
