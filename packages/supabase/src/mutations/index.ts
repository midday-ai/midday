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
