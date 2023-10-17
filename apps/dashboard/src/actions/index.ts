"use server";

import { env } from "@/env.mjs";
import { getAccessToken, getTransactions } from "@midday/gocardless";
import { getSupabaseServerActionClient } from "@midday/supabase/action-client";
import {
  createTeamBankAccounts,
  createTransactions,
} from "@midday/supabase/mutations";
import { capitalCase } from "change-case";

const baseUrl = "https://api.resend.com";

export async function sendFeeback(formData: FormData) {
  const supabase = await getSupabaseServerActionClient();
  const feedback = formData.get("feedback");
  const { data } = await supabase.auth.getSession();

  const res = await fetch(`${baseUrl}/email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "feedback@midday.ai",
      to: "pontus@lostisland.co",
      subject: "Feedback",
      text: `${feedback} \nName: ${data?.session?.data_metadata?.name} \nEmail: ${data?.session?.email}`,
    }),
  });

  const json = await res.json();

  return json;
}

export async function subscribeEmail(formData: FormData, userGroup: string) {
  const email = formData.get("email");

  const res = await fetch(env.LOOPS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, userGroup }),
  });

  const json = await res.json();

  return json;
}

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
          date: data.valueDate,
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

export async function createTeamBankAccountsAction(accounts) {
  const supabase = await getSupabaseServerActionClient();
  await createTeamBankAccounts(supabase, accounts);
}
