"use server";

import { getTransactions, transformTransactions } from "@midday/gocardless";
import { Events, scheduler } from "@midday/jobs";
import { getUser } from "@midday/supabase/cached-queries";
import { createBankAccounts } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { connectBankAccountSchema } from "./schema";

export const connectBankAccountAction = action(
  connectBankAccountSchema,
  async (accounts) => {
    const user = await getUser();
    const supabase = createClient();
    const teamId = user.data.team_id;

    const { data } = await createBankAccounts(supabase, accounts);

    const promisses = data?.map(async (account) => {
      // Fetch transactions
      const { transactions } = await getTransactions(account.account_id);

      // Update bank account last_accessed
      await supabase
        .from("bank_accounts")
        .update({
          last_accessed: new Date().toISOString(),
        })
        .eq("id", account.id);

      // Create transactions
      await supabase
        .from("transactions")
        .insert(
          transformTransactions(transactions?.booked, {
            accountId: account.id, // Bank account row id
            teamId,
          })
        )
        .select();

      // Schedule sync for each account
      await scheduler.register(account.id, {
        type: "interval",
        options: {
          seconds: 3600, // every 1h
        },
      });

      return;
    });

    await Promise.all(promisses);

    revalidateTag(`bank_connections_${teamId}`);
    revalidateTag(`transactions_${teamId}`);
    revalidateTag(`spending_${teamId}`);
    revalidateTag(`metrics_${teamId}`);

    return;
  }
);
