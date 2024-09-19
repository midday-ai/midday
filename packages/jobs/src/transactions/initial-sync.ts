import Midday from "@solomon-ai/financial-engine-sdk";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { processBatch } from "../utils/process";
import { sleep } from "../utils/sleep";
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

    await io.logger.info(`Starting initial sync for team: ${teamId}`);

    const settingUpAccount = await io.createStatus("setting-up-account-bank", {
      label: "Setting up account",
      data: { step: "connecting_bank" },
    });
    await io.logger.debug(
      `Created status: setting-up-account-bank for team: ${teamId}`
    );

    try {
      await scheduler.register(teamId, {
        type: "interval",
        options: { seconds: 3600 * 8 }, // every 8h
      });
      await io.logger.info(`Registered scheduler for team: ${teamId}`);
    } catch (error) {
      await io.logger.error(`Error registering scheduler for team: ${teamId}`, {
        error,
      });
    }

    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token)"
      )
      .eq("team_id", teamId)
      .eq("enabled", true);

    await io.logger.info(
      `Found ${accountsData?.length} accounts for team: ${teamId}`
    );

    const promises = accountsData?.map(async (account) => {
      await io.logger.debug(
        `Processing account: ${account.id} for team: ${teamId}`
      );
      try {
        const getTransactions = async (retries = 0): Promise<Midday.TransactionsSchema> => {
          try {
            return await engine.transactions.list({
              provider: account.bank_connection.provider,
              accountId: account.account_id,
              accountType: getClassification(account.type),
              accessToken: account.bank_connection?.access_token,
            });
          } catch (error) {
            if ((error instanceof Midday.APIError && error.status === 429 && retries < 5) || (error instanceof Midday.APIError && error.message.includes("rate limit") && retries < 5)) {
              const delay = Math.pow(2, retries) * 1000; // Exponential backoff
              await io.logger.warn(`Rate limited, retrying in ${delay}ms`, { retries });
              await sleep(delay);
              return getTransactions(retries + 1);
            }
            throw error;
          }
        };

        const transactions = await getTransactions();
        
        await io.logger.info(
          `Retrieved ${transactions.data?.length} transactions for account: ${account.id}`
        );

        const formattedTransactions = transactions.data?.map((transaction) =>
          transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          })
        );
        await io.logger.debug(
          `Formatted ${formattedTransactions?.length} transactions for account: ${account.id}`
        );

        await processBatch(
          formattedTransactions,
          BATCH_LIMIT,
          async (batch) => {
            await io.logger.debug(
              `Upserting batch of ${batch.length} transactions for account: ${account.id}`
            );
            const { data, error } = await supabase.from("transactions").upsert(batch, {
              onConflict: "internal_id",
              ignoreDuplicates: true,
            });
           
            if (error) {
              await io.logger.error(`Error upserting transactions for account: ${account.id}`, { error });
            }
           
            await io.logger.debug(`Upserted batch ${data} for account: ${account.id}`);
            return batch;
          }
        );
      } catch (error) {
        await io.logger.error(
          `Error processing transactions for account: ${account.id}`,
          { error }
        );
        if (error instanceof Midday.APIError) {
          const parsedError = parseAPIError(error);
          await io.logger.warn(`API Error for account: ${account.id}`, {
            parsedError,
          });
          await io.supabase.client
            .from("bank_connections")
            .update({
              status: parsedError.code,
              error_details: parsedError.message,
            })
            .eq("id", account.bank_connection.id);
          await io.logger.info(
            `Updated bank connection status for account: ${account.id}`
          );
        }
      }

      try {
        const balance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });
        await io.logger.debug(`Retrieved balance for account: ${account.id}`, {
          balance: balance.data?.amount,
        });

        if (balance.data?.amount) {
          await io.supabase.client
            .from("bank_accounts")
            .update({ balance: balance.data.amount })
            .eq("id", account.id);
          await io.logger.info(`Updated balance for account: ${account.id}`);
        }

        await io.supabase.client
          .from("bank_connections")
          .update({ last_accessed: new Date().toISOString() })
          .eq("id", account.bank_connection.id);
        await io.logger.debug(
          `Updated last_accessed for bank connection: ${account.bank_connection.id}`
        );
      } catch (error) {
        await io.logger.error(
          `Error updating balance or last_accessed for account: ${account.id}`,
          { error }
        );
      }
    });

    await settingUpAccount.update("setting-up-account-transactions", {
      data: { step: "getting_transactions" },
    });
    await io.logger.debug(
      `Updated status to setting-up-account-transactions for team: ${teamId}`
    );

    try {
      if (promises) {
        await Promise.all(promises);
        await io.logger.info(
          `Completed processing all accounts for team: ${teamId}`
        );
      }
    } catch (error) {
      await io.logger.error(`Error processing accounts for team: ${teamId}`, {
        error,
      });
    }

    const tagsToRevalidate = [
      `bank_connections_${teamId}`,
      `transactions_${teamId}`,
      `spending_${teamId}`,
      `metrics_${teamId}`,
      `bank_accounts_${teamId}`,
      `insights_${teamId}`,
      `expenses_${teamId}`,
    ];
    tagsToRevalidate.forEach((tag) => revalidateTag(tag));
    await io.logger.info(`Revalidated tags for team: ${teamId}`, {
      tags: tagsToRevalidate,
    });

    await settingUpAccount.update("setting-up-account-completed", {
      data: { step: "completed" },
    });
    await io.logger.info(`Completed initial sync for team: ${teamId}`);
  },
});
