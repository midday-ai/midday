// @ts-nocheck
import {
  endOfMonth,
  formatISO,
  parseISO,
  startOfMonth,
  subYears,
} from "date-fns";
import type { Client } from "../types";

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select(
      `
      *,
      team:team_id(*)
    `,
    )
    .eq("id", userId)
    .single()
    .throwOnError();
}

export async function getTeamByIdQuery(supabase: Client, teamId: string) {
  return supabase.from("teams").select("*").eq("id", teamId).single();
}

export async function getInboxAccountByIdQuery(supabase: Client, id: string) {
  return supabase
    .from("inbox_accounts")
    .select(
      "id, email, provider, access_token, refresh_token, expiry_date, last_accessed",
    )
    .eq("id", id)
    .single();
}

export async function getExistingInboxAttachmentsQuery(
  supabase: Client,
  inputArray: string[],
) {
  return supabase
    .from("inbox")
    .select("reference_id")
    .in("reference_id", inputArray);
}
