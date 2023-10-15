"use server";

import { getSupabaseServerActionClient } from "@midday/supabase/action-client";
import { capitalCase } from "change-case";
import { getAccessToken, getTransactions } from "./gocardless";

export async function initialTransactionsSync(ids: string[]) {
  const supabase = await getSupabaseServerActionClient();
  const { access } = await getAccessToken();

  await Promise.all(
    ids.map(async (id) => {
      const { transactions } = await getTransactions({
        token: access,
        id,
      });

      if (!transactions?.booked.length) {
        return;
      }

      await createTransactions(
        supabase,
        transactions.booked.map((data) => ({
          transaction_id: data.transactionId,
          reference_id: data.entryReference,
          booking_date: data.bookingDate,
          value_date: data.valueDate,
          display: capitalCase(data.additionalInformation),
          original: data.additionalInformation,
          transaction_code: data.proprietaryBankTransactionCode,
          internal_id: data.internalTransactionId,
          amount: data.transactionAmount.amount,
          currency: data.transactionAmount.currency,
          bank_account_id: id,
        })),
      );
    }),
  );
}
