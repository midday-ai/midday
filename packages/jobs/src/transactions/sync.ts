import { Provider } from "@midday/providers";
import { revalidateTag } from "next/cache";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
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

    const { data: accountsData, error: accountsError } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, bank_connection:bank_connection_id(provider, access_token, enrollment_id)"
      )
      .eq("team_id", teamId)
      .eq("enabled", true);

    if (!accountsData?.length) {
      // NOTE: Remove all old schedulers
      const event = await scheduler.unregister(ctx.source.id);
      await io.logger.debug("Unregister", event);
    }

    if (accountsError) {
      await io.logger.error("Accounts Error", accountsError);
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
        latest: true,
      });
    });

    try {
      if (promises) {
        const result = await Promise.all(promises);
        const transactions = result?.flat();

        await io.logger.debug("Transactions", transactions);

        if (!transactions?.length) {
          return null;
        }

        const { error: transactionsError, data: transactionsData } =
          await supabase
            .from("decrypted_transactions")
            .upsert(transactions, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            })
            .select("*, name:decrypted_name");

        if (transactionsError) {
          await io.logger.error("Transactions error", transactionsError);
        }

        if (transactionsData && transactionsData?.length > 0) {
          await io.sendEvent("🔔 Send notifications", {
            name: Events.TRANSACTIONS_NOTIFICATION,
            payload: {
              teamId,
              transactions: transactionsData,
            },
          });

          revalidateTag(`transactions_${teamId}`);
          revalidateTag(`spending_${teamId}`);
          revalidateTag(`metrics_${teamId}`);
        }
      }
    } catch (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }
  },
});
