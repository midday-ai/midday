"use server";

import { processPromisesBatch } from "@/utils/process";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createTransactionsSchema } from "./schema";

const BATCH_LIMIT = 300;

export const createTransactionsAction = authActionClient
  .schema(createTransactionsSchema)
  .metadata({
    name: "create-transactions",
  })
  .action(
    async ({
      parsedInput: { currency, transactions, accountId },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;

      // Update account with currency if not set
      await supabase
        .from("bank_accounts")
        .update({
          currency,
        })
        .eq("id", accountId)
        .is("currency", null);

      // NOTE: We will get all the transactions at once for each account so
      // we need to guard against massive payloads
      await processPromisesBatch(transactions, BATCH_LIMIT, async (batch) => {
        await supabase.from("transactions").upsert(batch, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        });
      });

      revalidateTag(`bank_connections_${teamId}`);
      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);
      revalidateTag(`bank_accounts_${teamId}`);
      revalidateTag(`insights_${teamId}`);

      return;
    },
  );
