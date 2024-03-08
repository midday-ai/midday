import { Provider } from "@midday/providers";
import { client, supabase } from "../client";
import { Jobs } from "../constants";
import { scheduler } from "./scheduler";

client.defineJob({
  id: Jobs.TRANSACTIONS_SYNC,
  name: "Transactions - Sync",
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

    const promises = accountsData?.map(async (account) => {
      const provider = new Provider({
        provider: account.bank_connection.provider,
      });

      if (!account) {
        return;
      }

      const transactions = await provider.getTransactions({
        teamId: account.team_id,
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
        bankAccountId: account.id,
      });

      await io.logger.debug("transactions", transactions);

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      // const { error, data: transactionsData } = await supabase
      //   .from("decrypted_transactions")
      //   .upsert(transactions, {
      //     onConflict: "internal_id",
      //     ignoreDuplicates: true,
      //   })
      //   .select("*, name:decrypted_name");
    });
  },
});
