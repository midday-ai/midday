"use server";

import { LogEvents } from "@midday/events/events";
import { createAttachments } from "@midday/supabase/mutations";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createTransactionSchema } from "./schema";

export const createTransactionAction = authActionClient
  .schema(createTransactionSchema)
  .metadata({
    name: "create-transaction",
    track: {
      event: LogEvents.CreateTransaction.name,
      channel: LogEvents.CreateTransaction.channel,
    },
  })
  .action(
    async ({
      parsedInput: { attachments, ...transaction },
      ctx: { user, supabase },
    }) => {
      const teamId = user.team_id;

      const { data: accountData } = await supabase
        .from("bank_accounts")
        .select("id, currency")
        .eq("id", transaction.bank_account_id)
        .is("currency", null)
        .single();

      // If the account currency is not set, set it to the transaction currency
      // Usually this is the case for new accounts
      if (!accountData?.currency) {
        await supabase
          .from("bank_accounts")
          .update({
            currency: transaction.currency,
            base_currency: transaction.currency,
          })
          .eq("id", transaction.bank_account_id);
      }

      const { data } = await supabase
        .from("transactions")
        .insert({
          ...transaction,
          team_id: teamId,
          method: "other",
          manual: true,
          notified: true,
          internal_id: `${teamId}_${nanoid()}`,
        })
        .select("*")
        .single();

      if (attachments && data) {
        await createAttachments(
          supabase,
          attachments.map((attachment) => ({
            ...attachment,
            transaction_id: data.id,
          })),
        );
      }

      revalidateTag(`transactions_${teamId}`);
      revalidateTag(`spending_${teamId}`);
      revalidateTag(`metrics_${teamId}`);
      revalidateTag(`insights_${teamId}`);

      return data;
    },
  );
