import { processPromisesBatch } from "@/utils/process";
import { Provider } from "@midday/providers";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { scheduler } from "./scheduler";

const BATCH_LIMIT = 300;

client.defineJob({
  id: Jobs.TRANSACTIONS_INITIAL_SYNC,
  name: "Transactions - Initial Sync",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_INITIAL_SYNC,
    schema: z.object({
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { teamId } = payload;

    const settingUpAccount = await io.createStatus("setting-up-account-bank", {
      label: "Setting up account",
      data: {
        step: "connecting_bank",
      },
    });

    try {
      // NOTE: Schedule a background job per team_id
      await scheduler.register(teamId, {
        type: "interval",
        options: {
          seconds: 3600 * 6, // every 8h
        },
      });
    } catch (error) {
      await io.logger.debug(`Error register new scheduler for team: ${teamId}`);
    }

    const { data: accountsData } = await io.supabase.client
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(provider, access_token)"
      )
      .eq("team_id", teamId)
      .eq("enabled", true)
      // NOTE: Only new accounts
      .is("last_accessed", null);

    const promises = accountsData?.map(async (account) => {
      const provider = new Provider({
        provider: account.bank_connection.provider,
      });

      const transactions = await provider.getTransactions({
        teamId: account.team_id,
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
        bankAccountId: account.id,
        accountType: account.type,
      });

      const balance = await provider.getAccountBalance({
        accountId: account.account_id,
        accessToken: account.bank_connection?.access_token,
      });

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      await processPromisesBatch(transactions, BATCH_LIMIT, async (batch) => {
        const formatted = batch.map(({ category, ...rest }) => ({
          ...rest,
          category_slug: category,
        }));

        await io.supabase.client.from("transactions").upsert(formatted, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        });
      });

      // Update bank account last_accessed
      await io.supabase.client
        .from("bank_accounts")
        .update({
          last_accessed: new Date().toISOString(),
          balance: balance?.amount,
        })
        .eq("id", account.id);
    });

    await settingUpAccount.update("setting-up-account-transactions", {
      data: {
        step: "getting_transactions",
      },
    });

    try {
      if (promises) {
        await Promise.all(promises);
      }
    } catch (error) {
      await io.logger.error(error);
      throw Error("Something went wrong");
    }

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);

    await settingUpAccount.update("setting-up-account-completed", {
      data: {
        step: "completed",
      },
    });
  },
});
