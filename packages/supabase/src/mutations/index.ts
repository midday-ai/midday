// @ts-nocheck
import { getAccessValidForDays } from "@midday/engine/gocardless/utils";
import { addDays, addMonths } from "date-fns";
import { nanoid } from "nanoid";
import type { Client } from "../types";
import { remove } from "../utils/storage";

type UpdateBankConnectionData = {
  id: string;
  referenceId?: string;
};

// NOTE: Only GoCardLess needs to be updated
export async function updateBankConnection(
  supabase: Client,
  data: UpdateBankConnectionData,
) {
  const { id, referenceId } = data;

  return await supabase
    .from("bank_connections")
    .update({
      expires_at: addDays(
        new Date(),
        getAccessValidForDays({ institutionId: id }),
      ).toDateString(),
      reference_id: referenceId,
    })
    .eq("id", id)
    .select()
    .single();
}

type UpdateTeamPlanData = {
  id: string;
  plan?: "trial" | "starter" | "pro";
  email?: string | null;
  canceled_at?: string | null;
};

export async function updateTeamPlan(
  supabase: Client,
  data: UpdateTeamPlanData,
) {
  const { id, ...rest } = data;

  return supabase
    .from("teams")
    .update(rest)
    .eq("id", id)
    .select("users_on_team(user_id)")
    .single();
}

type CreateDocumentTagEmbeddingParams = {
  slug: string;
  name: string;
  embedding: string;
};

export async function createDocumentTagEmbedding(
  supabase: Client,
  params: CreateDocumentTagEmbeddingParams,
) {
  return supabase.from("document_tag_embeddings").insert({
    embedding: params.embedding,
    slug: params.slug,
    name: params.name,
  });
}

type DeleteBankConnectionParams = {
  id: string;
};

export async function deleteBankConnection(
  supabase: Client,
  params: DeleteBankConnectionParams,
) {
  return supabase
    .from("bank_connections")
    .delete()
    .eq("id", params.id)
    .select("reference_id, provider, access_token")
    .single();
}

type UpdateInboxAccountParams = {
  id: string;
  refreshToken?: string;
  accessToken?: string;
  expiryDate?: string;
  scheduleId?: string;
};

export async function updateInboxAccount(
  supabase: Client,
  params: UpdateInboxAccountParams,
) {
  return supabase
    .from("inbox_accounts")
    .update({
      refresh_token: params.refreshToken,
      access_token: params.accessToken,
      expiry_date: params.expiryDate,
      schedule_id: params.scheduleId,
    })
    .eq("id", params.id);
}

type UpsertInboxAccountParams = {
  teamId: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  lastAccessed: string;
  provider: "gmail";
  externalId: string;
  expiryDate: string;
};

export async function upsertInboxAccount(
  supabase: Client,
  params: UpsertInboxAccountParams,
) {
  return supabase
    .from("inbox_accounts")
    .upsert(
      {
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        last_accessed: params.lastAccessed,
        team_id: params.teamId,
        email: params.email,
        provider: params.provider,
        external_id: params.externalId,
        expiry_date: params.expiryDate,
      },
      {
        onConflict: "external_id",
        ignoreDuplicates: false,
      },
    )
    .select("id, provider, external_id")
    .single();
}
