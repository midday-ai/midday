"use server";

import { env } from "@/env.mjs";
import { getTransactions } from "@midday/gocardless";
import {
  createTeamBankAccounts,
  createTransactions,
  updateSimilarTransactions,
  updateTransaction,
} from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { capitalCase } from "change-case";
import { revalidateTag } from "next/cache";

const baseUrl = "https://api.resend.com";

export async function sendFeeback(formData: FormData) {
  const supabase = await createClient();
  const feedback = formData.get("feedback");
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
      text: `${feedback} \nName: ${session?.user?.user_metadata?.name} \nEmail: ${session?.user?.email}`,
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

const mapTransactionMethod = (method: string) => {
  switch (method) {
    case "Payment":
    case "Bankgiro payment":
    case "Incoming foreign payment":
      return "payment";
    case "Card purchase":
    case "Card foreign purchase":
      return "card_purchase";
    case "Card ATM":
      return "card_atm";
    case "Transfer":
      return "transfer";
    default:
      return "other";
  }
};

export async function initialTransactionsSync(accounts: any) {
  const supabase = await createClient();

  await Promise.all(
    accounts.map(async (account) => {
      const { transactions } = await getTransactions(account.account_id);

      if (!transactions?.booked.length) {
        return;
      }

      await createTransactions(
        supabase,
        transactions.booked.map((data) => ({
          transaction_id: data.transactionId,
          reference: data.entryReference,
          booking_date: data.bookingDate,
          date: data.valueDate,
          name: capitalCase(data.additionalInformation),
          original: data.additionalInformation,
          method: mapTransactionMethod(data.proprietaryBankTransactionCode),
          provider_transaction_id: data.internalTransactionId,
          amount: data.transactionAmount.amount,
          currency: data.transactionAmount.currency,
          bank_account_id: account.id,
          category: data.transactionAmount.amount > 0 ? "income" : null,
        })),
      );
    }),
  );
}

export async function createTeamBankAccountsAction(accounts) {
  const supabase = await createClient();
  return createTeamBankAccounts(supabase, accounts);
}

export async function updateTransactionAction(id: string, data: any) {
  const supabase = await createClient();
  await updateTransaction(supabase, id, data);
  revalidateTag("transactions");
}

export async function updateSimilarTransactionsAction(id: string) {
  const supabase = await createClient();
  await updateSimilarTransactions(supabase, id);
  revalidateTag("transactions");
}
