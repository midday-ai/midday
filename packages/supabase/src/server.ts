"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { Database } from "./types/db";

export const createServerClient = cache(() =>
  createServerComponentClient<Database>({ cookies }),
);

export async function getSession() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUserDetails() {
  const supabase = createServerClient();
  const user = await getSession();

  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("id", user?.user.id)
    .single();

  console.error(error);

  return data;
}

export async function saveAccounts() {
  const supabase = createServerClient();
  const user = await getSession();
}

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

export async function getUserTeams() {
  const supabase = createServerClient();
  const user = await getUserDetails();

  const { data } = await supabase
    .from("members")
    .select(`
      *, 
      team:teams(*)
    `)
    .eq("team_id", user?.team_id);

  return data;
}

export async function getTeamBankAccounts() {
  const supabase = createServerClient();
  const user = await getUserDetails();

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("team_id", user?.team_id);

  console.error(error);

  return data;
}

export async function getTeamMembers(team_id: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *, 
      members(*)
    `)
    .eq("id", team_id);

  console.error(error);

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

export async function getTransactions({ from = 0, to = 20 }) {
  const supabase = createServerClient();
  const user = await getUserDetails();

  // TODO: Set "bank_account_id" uuid references bank_account
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      account:bank_account_id(*)
    `)
    .eq("team_id", user?.team_id)
    .range(from, to);

  console.error(error);

  return data;
}
