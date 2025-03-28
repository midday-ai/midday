import { getAccessValidForDays } from "@midday/engine/gocardless/utils";
import { addDays } from "date-fns";
import { getCurrentUserTeamQuery, getUserInviteQuery } from "../queries";
import type { Client } from "../types";

type CreateBankConnectionPayload = {
  accounts: {
    account_id: string;
    institution_id: string;
    logo_url: string;
    name: string;
    bank_name: string;
    currency: string;
    enabled: boolean;
    balance: number;
    type: "depository" | "credit" | "other_asset" | "loan" | "other_liability";
    account_reference: string | null;
    expires_at: string | null;
  }[];
  accessToken?: string;
  enrollmentId?: string;
  referenceId?: string;
  teamId: string;
  userId: string;
  provider: "gocardless" | "teller" | "plaid" | "enablebanking";
};

export async function createBankConnection(
  supabase: Client,
  {
    accounts,
    accessToken,
    enrollmentId,
    referenceId,
    teamId,
    userId,
    provider,
  }: CreateBankConnectionPayload,
) {
  // Get first account to create a bank connection
  const account = accounts?.at(0);

  if (!account) {
    return;
  }

  const bankConnection = await supabase
    .from("bank_connections")
    .upsert(
      {
        institution_id: account.institution_id,
        name: account.bank_name,
        logo_url: account.logo_url,
        team_id: teamId,
        provider,
        access_token: accessToken,
        enrollment_id: enrollmentId,
        reference_id: referenceId,
        expires_at: account.expires_at,
      },
      {
        onConflict: "institution_id, team_id",
      },
    )
    .select()
    .single();

  await supabase.from("bank_accounts").upsert(
    accounts.map(
      (account) => ({
        account_id: account.account_id,
        bank_connection_id: bankConnection?.data?.id,
        team_id: teamId,
        created_by: userId,
        name: account.name,
        currency: account.currency,
        enabled: account.enabled,
        type: account.type,
        account_reference: account.account_reference,
        balance: account.balance ?? 0,
      }),
      {
        onConflict: "account_id",
      },
    ),
  );

  return bankConnection;
}

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

export async function updateTransaction(
  supabase: Client,
  id: string,
  data: any,
) {
  return supabase
    .from("transactions")
    .update(data)
    .eq("id", id)
    .select("id, category, category_slug, team_id, name, status, internal")
    .single();
}

export async function updateUser(supabase: Client, data: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  return supabase
    .from("users")
    .update(data)
    .eq("id", session.user.id)
    .select()
    .single();
}

export async function deleteUser(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  await Promise.all([
    supabase.auth.admin.deleteUser(session.user.id),
    supabase.from("users").delete().eq("id", session.user.id),
    supabase.auth.signOut(),
  ]);

  return session.user.id;
}

export async function updateTeam(supabase: Client, data: any) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  return supabase
    .from("teams")
    .update(data)
    .eq("id", userData?.team_id)
    .select("*")
    .maybeSingle();
}

type UpdateUserTeamRoleParams = {
  role: "owner" | "member";
  userId: string;
  teamId: string;
};

export async function updateUserTeamRole(
  supabase: Client,
  params: UpdateUserTeamRoleParams,
) {
  const { role, userId, teamId } = params;

  return supabase
    .from("users_on_team")
    .update({
      role,
    })
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .select()
    .single();
}

type DeleteTeamMemberParams = {
  userId: string;
  teamId: string;
};

export async function deleteTeamMember(
  supabase: Client,
  params: DeleteTeamMemberParams,
) {
  return supabase
    .from("users_on_team")
    .delete()
    .eq("user_id", params.userId)
    .eq("team_id", params.teamId)
    .select()
    .single();
}

export async function deleteBankAccount(supabase: Client, id: string) {
  return await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", id)
    .select()
    .single();
}

type UpdateBankAccountParams = {
  id: string;
  teamId: string;
  name: string;
  type: "depository" | "credit" | "other_asset" | "loan" | "other_liability";
  balance?: number;
};

export async function updateBankAccount(
  supabase: Client,
  params: UpdateBankAccountParams,
) {
  const { id, teamId, ...data } = params;

  return await supabase
    .from("bank_accounts")
    .update(data)
    .eq("id", id)
    .eq("team_id", teamId)
    .select()
    .single();
}

type UpdateSimilarTransactionsCategoryParams = {
  id: string;
  team_id: string;
};

export async function updateSimilarTransactionsCategory(
  supabase: Client,
  params: UpdateSimilarTransactionsCategoryParams,
) {
  const { id, team_id } = params;

  const transaction = await supabase
    .from("transactions")
    .select("name, category_slug")
    .eq("id", id)
    .single();

  if (!transaction?.data?.category_slug) {
    return null;
  }

  return supabase
    .from("transactions")
    .update({ category_slug: transaction.data.category_slug })
    .textSearch("fts_vector", `${transaction.data.name.replaceAll(" ", "+")}:*`)
    .eq("team_id", team_id)
    .select("id, team_id");
}

type UpdateSimilarTransactionsRecurringParams = {
  id: string;
  team_id: string;
};

export async function updateSimilarTransactionsRecurring(
  supabase: Client,
  params: UpdateSimilarTransactionsRecurringParams,
) {
  const { id, team_id } = params;

  const transaction = await supabase
    .from("transactions")
    .select("name, recurring, frequency")
    .eq("id", id)
    .single();

  return supabase
    .from("transactions")
    .update({
      recurring: transaction.data?.recurring,
      frequency: transaction.data?.frequency,
    })
    .textSearch(
      "fts_vector",
      `'${transaction.data.name.replaceAll(" ", "+")}:*'`,
    )
    .eq("team_id", team_id)
    .select("id, team_id");
}

export type Attachment = {
  type: string;
  name: string;
  size: number;
  path: string[];
  transaction_id: string;
};

export async function createAttachments(
  supabase: Client,
  attachments: Attachment[],
) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  const { data } = await supabase
    .from("transaction_attachments")
    .insert(
      attachments.map((attachment) => ({
        ...attachment,
        team_id: userData?.team_id,
      })),
    )
    .select();

  return data;
}

export async function deleteAttachment(supabase: Client, id: string) {
  const { data } = await supabase
    .from("transaction_attachments")
    .delete()
    .eq("id", id)
    .select("id, transaction_id, name, team_id")
    .single();

  return data;
}

type CreateTeamParams = {
  name: string;
  currency?: string;
};

export async function createTeam(supabase: Client, params: CreateTeamParams) {
  const { data } = await supabase.rpc("create_team_v2", {
    name: params.name,
    currency: params.currency,
  });

  return data;
}

type LeaveTeamParams = {
  userId: string;
  teamId: string;
};

export async function leaveTeam(supabase: Client, params: LeaveTeamParams) {
  await supabase
    .from("users")
    .update({
      team_id: null,
    })
    .eq("id", params.userId)
    .eq("team_id", params.teamId);

  return supabase
    .from("users_on_team")
    .delete()
    .eq("team_id", params.teamId)
    .eq("user_id", params.userId)
    .select()
    .single();
}

export async function joinTeamByInviteCode(supabase: Client, code: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.email) {
    return;
  }

  const { data: inviteData } = await getUserInviteQuery(supabase, {
    code,
    email: session.user.email,
  });

  if (inviteData) {
    // Add user team
    await supabase.from("users_on_team").insert({
      user_id: session.user.id,
      team_id: inviteData?.team_id,
      role: inviteData.role,
    });

    // Set current team
    const { data } = await supabase
      .from("users")
      .update({
        team_id: inviteData?.team_id,
      })
      .eq("id", session.user.id)
      .select()
      .single();

    // remove invite
    await supabase.from("user_invites").delete().eq("code", code);

    return data;
  }

  return null;
}

type UpdateInboxByIdParams = {
  id: string;
  display_name?: string;
  status?: "deleted";
  attachment_id?: string;
  transaction_id?: string;
  teamId: string;
};

export async function updateInboxById(
  supabase: Client,
  params: UpdateInboxByIdParams,
) {
  const { id, teamId, ...data } = params;

  const inbox = await supabase
    .from("inbox")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  const { data: inboxData } = inbox;

  if (inboxData && params.transaction_id) {
    const { data: attachmentData } = await supabase
      .from("transaction_attachments")
      .insert({
        type: inboxData.content_type,
        path: inboxData.file_path,
        transaction_id: params.transaction_id,
        size: inboxData.size,
        name: inboxData.file_name,
        team_id: teamId,
      })
      .select()
      .single();

    if (attachmentData) {
      return supabase
        .from("inbox")
        .update({ attachment_id: attachmentData.id })
        .eq("id", params.id)
        .select()
        .single();
    }
  } else {
    if (inboxData?.attachment_id) {
      return supabase
        .from("transaction_attachments")
        .delete()
        .eq("id", inboxData.attachment_id);
    }
  }

  return inbox;
}

type CreateProjectParams = {
  name: string;
  description?: string;
  estimate?: number;
  billable?: boolean;
  rate?: number;
  currency?: string;
  customer_id?: string;
  team_id: string;
};

export async function createProject(
  supabase: Client,
  params: CreateProjectParams,
) {
  return supabase.from("tracker_projects").insert(params).select().single();
}

type CreateTransactionCategoryParams = {
  teamId: string;
  categories: {
    name: string;
    color?: string;
    description?: string;
    vat?: number;
  }[];
};

export async function createTransactionCategories(
  supabase: Client,
  params: CreateTransactionCategoryParams,
) {
  const { teamId, categories } = params;

  return supabase.from("transaction_categories").insert(
    categories.map((category) => ({
      ...category,
      team_id: teamId,
    })),
  );
}

type UpdateTransactionCategoryParams = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  vat: number | null;
};

export async function updateTransactionCategory(
  supabase: Client,
  params: UpdateTransactionCategoryParams,
) {
  const { id, name, color, description, vat } = params;

  return supabase
    .from("transaction_categories")
    .update({ name, color, description, vat })
    .eq("id", id);
}

export async function deleteTransactionCategory(supabase: Client, id: string) {
  return supabase
    .from("transaction_categories")
    .delete()
    .eq("id", id)
    .eq("system", false);
}

type DeleteTransactionsParams = {
  ids: string[];
};

export async function deleteTransactions(
  supabase: Client,
  params: DeleteTransactionsParams,
) {
  return supabase
    .from("transactions")
    .delete()
    .in("id", params.ids)
    .eq("manual", true);
}
