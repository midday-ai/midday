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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function getUserDetails() {
  const supabase = createServerClient();
  const user = await getSession();

  try {
    const { data } = await supabase
      .from("users")
      .select()
      .eq("id", user?.user.id)
      .single();
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

export async function saveAccounts() {
  const supabase = createServerClient();
  const user = await getSession();
}

export async function createAccounts(accounts) {
  const supabase = createServerClient();
  const user = await getSession();

  const { data } = await supabase
    .from("accounts")
    .insert(
      accounts.map((account_id) => ({
        account_id,
        created_by: user?.user.id,
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

  const { data } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("team_id", user?.team_id);

  return data;
}

export async function getTeamMembers() {
  const supabase = createServerClient();
  const user = await getSession();

  const { data, error } = await supabase.from("teams").select(`
      *, 
      members(*)
    `);

  console.log(data, error);
}

export async function createTransactions(transactions) {
  const supabase = createServerClient();
  const user = await getSession();

  const { data } = await supabase.from("transactions").insert(
    transactions.map((transaction) => ({
      ...transaction,
    })),
  );

  return data;
}
