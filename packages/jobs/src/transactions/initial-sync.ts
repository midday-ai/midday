import Midday from "@midday-ai/engine";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";
import { scheduler } from "./scheduler";

const BATCH_LIMIT = 500;

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
    const supabase = io.supabase.client;

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
          seconds: 3600 * 8, // every 8h
        },
      });
    } catch (error) {
      await io.logger.debug(`Error register new scheduler for team: ${teamId}`);
    }

    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token)",
      )
      .eq("team_id", teamId)
      .eq("enabled", true);

    const promises = accountsData?.map(async (account) => {
      try {
        const transactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: getClassification(account.type),
          accessToken: account.bank_connection?.access_token,
        });

        const formattedTransactions = transactions.data?.map((transaction) => {
          return transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          });
        });

        // NOTE: We will get all the transactions at once for each account so
        // we need to guard against massive payloads
        await processBatch(
          formattedTransactions,
          BATCH_LIMIT,
          async (batch) => {
            await supabase.from("transactions").upsert(batch, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            });
          },
        );
      } catch (error) {
        if (error instanceof Midday.APIError) {
          const parsedError = parseAPIError(error);

          await io.supabase.client
            .from("bank_connections")
            .update({
              status: parsedError.code,
              error_details: parsedError.message,
            })
            .eq("id", account.bank_connection.id);
        }
      }

      const balance = await engine.accounts.balance({
        provider: account.bank_connection.provider,
        id: account.account_id,
        accessToken: account.bank_connection?.access_token,
      });

      // Update bank account balance
      if (balance.data?.amount) {
        await io.supabase.client
          .from("bank_accounts")
          .update({
            balance: balance.data.amount,
          })
          .eq("id", account.id);
      }

      // Update bank connection last accessed
      // TODO: Fix so it only update once per connection
      await io.supabase.client
        .from("bank_connections")
        .update({ last_accessed: new Date().toISOString() })
        .eq("id", account.bank_connection.id);
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
      throw new Error("Something went wrong");
    }

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);
    revalidateTag(`bank_accounts_${teamId}`);
    revalidateTag(`insights_${teamId}`);
    revalidateTag(`expenses_${teamId}`);

    await settingUpAccount.update("setting-up-account-completed", {
      data: {
        step: "completed",
      },
    });
  },
});
