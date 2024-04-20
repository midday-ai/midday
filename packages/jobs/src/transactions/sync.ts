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
        "id, team_id, account_id, bank_connection:bank_connection_id(provider, access_token)"
      )
      .eq("team_id", teamId)
      .eq("enabled", true);

    if (accountsError) {
      await io.logger.error("Accounts Error", accountsError);
    }

    const promises = accountsData?.map(async (account) => {
      const provider = new Provider({
        provider: account.bank_connection.provider,
      });

      try {
        const balance = await provider.getAccountBalance({
          accountId: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });

        // Update bank account
        await io.supabase.client
          .from("bank_accounts")
          .update({
            balance: balance?.amount,
            last_accessed: new Date().toISOString(),
          })
          .eq("id", account.id);
      } catch (error) {
        await io.logger.error("Update Account Balance Error", error);
      }

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
              transactions: transactionsData.map((transaction) => ({
                id: transaction.id,
                date: transaction.date,
                amount: transaction.amount,
                name: transaction.name,
                currency: transaction.currency,
              })),
            },
          });

          revalidateTag(`transactions_${teamId}`);
          revalidateTag(`spending_${teamId}`);
          revalidateTag(`metrics_${teamId}`);
        }

        revalidateTag(`bank_accounts_${teamId}`);
      }
    } catch (error) {
      await io.logger.error(JSON.stringify(error, null, 2));
    }
  },
});
