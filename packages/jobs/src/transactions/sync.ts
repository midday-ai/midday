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
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token)",
      )
      .eq("team_id", teamId)
      .eq("enabled", true)
      .eq("manual", false);

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

        // Update account balance
        await io.supabase.client
          .from("bank_accounts")
          .update({ balance: balance?.amount })
          .eq("id", account.id);

        // Update bank connection last accessed
        // TODO: Fix so it only update once per connection
        await io.supabase.client
          .from("bank_connections")
          .update({ last_accessed: new Date().toISOString() })
          .eq("id", account.bank_connection.id);
      } catch (error) {
        await io.logger.error(
          `Update Account Balance Error. Provider: ${account.bank_connection.provider} Account id: ${account.account_id}`,
          error,
        );
      }

      return provider.getTransactions({
        teamId: account.team_id,
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
        bankAccountId: account.id,
        latest: true,
        accountType: account.type,
      });
    });

    try {
      if (promises) {
        const result = await Promise.all(promises);
        const transactions = result.flat()?.map(({ category, ...rest }) => ({
          ...rest,
          category_slug: category,
        }));

        if (!transactions?.length) {
          return null;
        }

        const { error: transactionsError, data: transactionsData } =
          await supabase
            .from("transactions")
            .upsert(transactions, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            })
            .select("*");

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
                category: transaction.category_slug,
                status: transaction.status,
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
