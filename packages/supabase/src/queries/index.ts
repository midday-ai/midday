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

type GetUserInviteQueryParams = {
  code: string;
  email: string;
};

export async function getUserInviteQuery(
  supabase: Client,
  params: GetUserInviteQueryParams,
) {
  return supabase
    .from("user_invites")
    .select("*")
    .eq("code", params.code)
    .eq("email", params.email)
    .single();
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
