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

    const { data: accountsData, error } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, bank_connection:bank_connection_id(provider, access_token, enrollment_id)"
      )
      .eq("team_id", teamId)
      .eq("enabled", true);

    await io.logger.debug("Accounts", JSON.stringify(accountsData, null, 2));

    if (error) {
      await io.logger.error("Accounts Error", error);
    }

    const promises = accountsData?.map(async (account) => {
      const provider = new Provider({
        provider: account.bank_connection.provider,
      });

      return provider.getTransactions({
        teamId: account.team_id,
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
        bankAccountId: account.id,
      });
    });

    try {
      if (promises) {
        const transactions = await Promise.all(promises);
        await io.logger.debug("Transactions", transactions);

        if (!transactions?.length) {
          return null;
        }

        // const { error, data: transactionsData } = await supabase
        //   .from("decrypted_transactions")
        //   .upsert(transactions, {
        //     onConflict: "internal_id",
        //     ignoreDuplicates: true,
        //   })
        //   .select("*, name:decrypted_name");
      }
    } catch (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }
  },
});
