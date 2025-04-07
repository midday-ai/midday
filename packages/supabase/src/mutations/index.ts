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

type UpdateTransactionData = {
  id: string;
  category_slug?: string | null;
  status?: "pending" | "archived" | "completed" | "posted" | "excluded" | null;
  internal?: boolean;
  note?: string | null;
  assigned_id?: string | null;
  recurring?: boolean;
};

export async function updateTransaction(
  supabase: Client,
  params: UpdateTransactionData,
) {
  const { id, ...data } = params;

  return supabase
    .from("transactions")
    .update(data)
    .eq("id", id)
    .select("id, category, category_slug, team_id, name, status, internal")
    .single();
}

type UpdateTransactionsData = {
  ids: string[];
  team_id: string;
  category_slug?: string | null;
  status?: "pending" | "archived" | "completed" | "posted" | "excluded" | null;
  internal?: boolean;
  note?: string | null;
  assigned_id?: string | null;
  tag_id?: string | null;
  recurring?: boolean;
  frequency?: "weekly" | "monthly" | "annually" | "irregular" | null;
};

export async function updateTransactions(
  supabase: Client,
  data: UpdateTransactionsData,
) {
  const { ids, tag_id, team_id, ...input } = data;

  if (tag_id) {
    // Save transaction tags for each transaction
    await supabase.from("transaction_tags").insert(
      ids.map((id) => ({
        transaction_id: id,
        tag_id,
        team_id,
      })),
    );
  }

  return supabase
    .from("transactions")
    .update(input)
    .in("id", ids)
    .select("id, category, category_slug, team_id, name, status, internal");
}

type UpdateUserParams = {
  id: string;
  full_name?: string | null;
  team_id?: string | null;
};

export async function updateUser(supabase: Client, data: UpdateUserParams) {
  const { id, ...input } = data;

  return supabase.from("users").update(input).eq("id", id).select().single();
}

type DeleteUserParams = {
  id: string;
};

export async function deleteUser(supabase: Client, params: DeleteUserParams) {
  const { id } = params;

  const { data: membersData } = await supabase
    .from("users_on_team")
    .select("team_id, team:team_id(id, name, members:users_on_team(id))")
    .eq("user_id", id);

  // Delete teams with only one member
  const teamIds = membersData
    ?.filter(({ team }) => team?.members.length === 1)
    .map(({ team_id }) => team_id);

  await Promise.all([
    supabase.auth.admin.deleteUser(id),
    supabase.from("users").delete().eq("id", id),
    supabase
      .from("teams")
      .delete()
      .in("id", teamIds ?? []),
  ]);

  return {
    id,
  };
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
  team_id: string;
  name: string;
  category_slug?: string | null;
  frequency?: "weekly" | "monthly" | "annually" | "irregular";
  recurring?: boolean;
};

export async function updateSimilarTransactionsCategory(
  supabase: Client,
  params: UpdateSimilarTransactionsCategoryParams,
) {
  const { name, team_id, category_slug, frequency, recurring } = params;

  return supabase
    .from("transactions")
    .update({
      category_slug,
      recurring,
      frequency,
    })
    .textSearch("fts_vector", `${name.replaceAll(" ", "+")}:*`)
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
      `${transaction.data?.name?.replaceAll(" ", "+")}:*`,
    )
    .eq("team_id", team_id)
    .select("id, team_id");
}

type CreateAttachmentsParams = {
  attachments: Attachment[];
  teamId: string;
};

export type Attachment = {
  type: string;
  name: string;
  size: number;
  path: string[];
  transaction_id: string;
};

export async function createAttachments(
  supabase: Client,
  params: CreateAttachmentsParams,
) {
  const { attachments, teamId } = params;

  return supabase
    .from("transaction_attachments")
    .insert(
      attachments.map((attachment) => ({
        ...attachment,
        team_id: teamId,
      })),
    )
    .select();
}

export async function deleteAttachment(supabase: Client, id: string) {
  const response = await supabase
    .from("transaction_attachments")
    .delete()
    .eq("id", id)
    .select("id, transaction_id, name, team_id")
    .single();

  // Find inbox by transaction_id and set transaction_id to null
  if (response?.data?.transaction_id) {
    await supabase
      .from("inbox")
      .update({
        transaction_id: null,
      })
      .eq("transaction_id", response.data.transaction_id);
  }

  return response;
}

type CreateTeamParams = {
  name: string;
  baseCurrency: string;
};

export async function createTeam(supabase: Client, params: CreateTeamParams) {
  const { data: teamId } = await supabase.rpc("create_team_v2", {
    name: params.name,
    currency: params.baseCurrency,
  });

  return {
    data: {
      id: teamId,
    },
  };
}

type LeaveTeamParams = {
  userId: string;
  teamId: string;
};

export async function leaveTeam(supabase: Client, params: LeaveTeamParams) {
  const [, response] = await Promise.all([
    supabase
      .from("users")
      .update({
        team_id: null,
      })
      .eq("id", params.userId)
      .eq("team_id", params.teamId),

    supabase
      .from("users_on_team")
      .delete()
      .eq("team_id", params.teamId)
      .eq("user_id", params.userId)
      .select()
      .single(),
  ]);

  return response;
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

type CreateTransactionCategoriesParams = {
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
  params: CreateTransactionCategoriesParams,
) {
  const { teamId, categories } = params;

  return supabase.from("transaction_categories").insert(
    categories.map((category) => ({
      ...category,
      team_id: teamId,
    })),
  );
}

type CreateTransactionCategoryParams = {
  teamId: string;
  name: string;
  color?: string;
  description?: string;
  vat?: number;
};

export async function createTransactionCategory(
  supabase: Client,
  params: CreateTransactionCategoryParams,
) {
  const { teamId, name, color, description, vat } = params;

  return supabase
    .from("transaction_categories")
    .insert({
      name,
      color,
      description,
      vat,
      team_id: teamId,
    })
    .select()
    .single();
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

type CreateTagParams = {
  teamId: string;
  name: string;
};

export async function createTag(supabase: Client, params: CreateTagParams) {
  return supabase
    .from("tags")
    .insert({
      name: params.name,
      team_id: params.teamId,
    })
    .select("id, name")
    .single();
}

type DeleteTagParams = {
  id: string;
};

export async function deleteTag(supabase: Client, params: DeleteTagParams) {
  return supabase.from("tags").delete().eq("id", params.id);
}

type UpdateTagParams = {
  id: string;
  name: string;
};

export async function updateTag(supabase: Client, params: UpdateTagParams) {
  const { id, name } = params;

  return supabase.from("tags").update({ name }).eq("id", id);
}

type CreateTransactionTagParams = {
  teamId: string;
  transactionId: string;
  tagId: string;
};

export async function createTransactionTag(
  supabase: Client,
  params: CreateTransactionTagParams,
) {
  return supabase.from("transaction_tags").insert({
    team_id: params.teamId,
    transaction_id: params.transactionId,
    tag_id: params.tagId,
  });
}

type DeleteTransactionTagParams = {
  transactionId: string;
  tagId: string;
};

export async function deleteTransactionTag(
  supabase: Client,
  params: DeleteTransactionTagParams,
) {
  const { transactionId, tagId } = params;

  return supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId)
    .eq("tag_id", tagId);
}

type AcceptTeamInviteParams = {
  userId: string;
  teamId: string;
};

export async function acceptTeamInvite(
  supabase: Client,
  params: AcceptTeamInviteParams,
) {
  const { userId, teamId } = params;

  const { data: inviteData } = await supabase
    .from("user_invites")
    .select("*")
    .eq("team_id", teamId)
    .eq("email", userId)
    .single();

  if (!inviteData) {
    return;
  }

  await Promise.all([
    supabase.from("users_on_team").insert({
      user_id: userId,
      role: inviteData.role,
      team_id: teamId,
    }),
    supabase.from("user_invites").delete().eq("id", inviteData.id),
  ]);
}

type DeclineTeamInviteParams = {
  email: string;
  teamId: string;
};

export async function declineTeamInvite(
  supabase: Client,
  params: DeclineTeamInviteParams,
) {
  const { email, teamId } = params;

  return supabase
    .from("user_invites")
    .delete()
    .eq("email", email)
    .eq("team_id", teamId);
}

type DisconnectAppParams = {
  appId: string;
  teamId: string;
};

export async function disconnectApp(
  supabase: Client,
  params: DisconnectAppParams,
) {
  const { appId, teamId } = params;

  return supabase
    .from("apps")
    .delete()
    .eq("app_id", appId)
    .eq("team_id", teamId)
    .select()
    .single();
}

type UpdateAppSettingsParams = {
  appId: string;
  teamId: string;
  option: {
    id: string;
    value: string | number | boolean;
  };
};

export async function updateAppSettings(
  supabase: Client,
  params: UpdateAppSettingsParams,
) {
  const { appId, teamId, option } = params;

  const { data: existingApp } = await supabase
    .from("apps")
    .select("settings")
    .eq("app_id", appId)
    .eq("team_id", teamId)
    .single();

  const updatedSettings = existingApp?.settings?.map((setting) => {
    if (setting.id === option.id) {
      return { ...setting, value: option.value };
    }

    return setting;
  });

  const { data } = await supabase
    .from("apps")
    .update({ settings: updatedSettings })
    .eq("app_id", appId)
    .eq("team_id", teamId)
    .select()
    .single();

  if (!data) {
    throw new Error("Failed to update app settings");
  }

  return data;
}

type DeleteTeamParams = {
  teamId: string;
};

export async function deleteTeam(supabase: Client, params: DeleteTeamParams) {
  const { teamId } = params;

  const { data } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .select("id, bank_connections(access_token, provider, reference_id)")
    .single();

  if (!data) {
    return;
  }

  await supabase.from("teams").delete().eq("id", data.id);

  return data;
}

type UpdateTeamMemberParams = {
  userId: string;
  teamId: string;
  role: "owner" | "member";
};

export async function updateTeamMember(
  supabase: Client,
  params: UpdateTeamMemberParams,
) {
  const { userId, teamId, role } = params;

  return supabase
    .from("users_on_team")
    .update({ role })
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .select()
    .single();
}

type CreateTeamInvitesParams = {
  teamId: string;
  invites: {
    email: string;
    role: "owner" | "member";
    invited_by: string;
  }[];
};

export async function createTeamInvites(
  supabase: Client,
  params: CreateTeamInvitesParams,
) {
  const { teamId, invites } = params;

  return supabase
    .from("user_invites")
    .upsert(
      invites.map((invite) => ({
        ...invite,
        team_id: teamId,
      })),
      {
        onConflict: "email, team_id",
        ignoreDuplicates: false,
      },
    )
    .select("email, code, user:invited_by(*), team:team_id(*)");
}

type DeleteTeamInviteParams = {
  teamId: string;
  inviteId: string;
};

export async function deleteTeamInvite(
  supabase: Client,
  params: DeleteTeamInviteParams,
) {
  const { teamId, inviteId } = params;

  return supabase
    .from("user_invites")
    .delete()
    .eq("id", inviteId)
    .eq("team_id", teamId)
    .select()
    .single();
}

export async function deleteCustomer(supabase: Client, id: string) {
  return supabase.from("customers").delete().eq("id", id).select("id");
}
