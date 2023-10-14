"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { getUserDetails } from "./server";
import { Database } from "./types/db";

export const createServerClient = cache(() =>
  createServerActionClient<Database>({ cookies }),
);

export async function createTeamBankAccounts(accounts) {
  const supabase = createServerClient();
  const user = await getUserDetails();

  const { data } = await supabase
    .from("bank_accounts")
    .insert(
      accounts.map((account) => ({
        account_id: account.id,
        bank_name: account.bank_name,
        logo_url: account.logo_url,
        created_by: user?.id,
        team_id: user?.team_id,
        provider: "gocardless",
      })),
    )
    .select();

  return data;
}

export async function createTransactions(transactions) {
  const supabase = createServerClient();
  const user = await getUserDetails();

  const { data, error } = await supabase.from("transactions").insert(
    transactions.map((transaction) => ({
      ...transaction,
      team_id: user?.team_id,
    })),
  );

  console.error(error);

  return data;
}
