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

type UpsertCustomerParams = {
  id?: string;
  teamId: string;
  name: string;
  email: string;
  token?: string;
  country?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  note?: string | null;
  website?: string | null;
  phone?: string | null;
  contact?: string | null;
  tags?:
    | {
        id: string;
        value: string;
      }[]
    | null;
};

export async function upsertCustomer(
  supabase: Client,
  params: UpsertCustomerParams,
) {
  const { id, tags, teamId, ...input } = params;

  const result = await supabase
    .from("customers")
    .upsert(
      {
        ...input,
        id,
        team_id: teamId,
      },
      {
        onConflict: "id",
      },
    )
    .select("id, name, tags:customer_tags(id, tag:tags(id, name))")
    .single();

  const customerId = result.data?.id;
  const currentTags = result.data?.tags || [];

  const currentTagIds = new Set(currentTags.map((ct) => ct.tag.id));
  const inputTagIds = new Set(tags?.map((t) => t.id) || []);

  // Tags to insert (in input but not current)
  const tagsToInsert = tags?.filter((tag) => !currentTagIds.has(tag.id)) || [];

  // Tag IDs to delete (in current but not input)
  const tagIdsToDelete = currentTags
    .filter((ct) => !inputTagIds.has(ct.tag.id))
    .map((ct) => ct.tag.id);

  // Perform inserts
  if (tagsToInsert.length > 0) {
    await supabase.from("customer_tags").insert(
      tagsToInsert.map((tag) => ({
        tag_id: tag.id,
        customer_id: customerId!,
        team_id: teamId,
      })),
    );
  }

  // Perform deletes
  if (tagIdsToDelete.length > 0) {
    await supabase
      .from("customer_tags")
      .delete()
      .eq("customer_id", customerId!)
      .in("tag_id", tagIdsToDelete);
  }

  return result;
}

type UpsertTrackerProjectParams = {
  id?: string;
  name: string;
  description?: string | null;
  estimate?: number | null;
  billable?: boolean | null;
  rate?: number | null;
  currency?: string | null;
  customer_id?: string | null;
  teamId: string;
  tags?:
    | {
        id: string;
        value: string;
      }[]
    | null;
};

export async function upsertTrackerProject(
  supabase: Client,
  params: UpsertTrackerProjectParams,
) {
  const { tags, teamId, ...projectData } = params;

  const result = await supabase
    .from("tracker_projects")
    .upsert(
      {
        ...projectData,
        team_id: teamId,
      },
      {
        onConflict: "id",
      },
    )
    .select("*, tags:tracker_project_tags(id, tag:tags(id, name))")
    .single();

  const projectId = result.data?.id;

  // Get current tags for the project
  const { data: currentTagsData } = await supabase
    .from("tracker_project_tags")
    .select("tag_id")
    .eq("tracker_project_id", projectId!);

  const currentTagIds = new Set(currentTagsData?.map((t) => t.tag_id) || []);
  const inputTagIds = new Set(tags?.map((t) => t.id) || []);

  // Tags to insert (in input but not current)
  const tagsToInsert = tags?.filter((tag) => !currentTagIds.has(tag.id)) || [];

  // Tag IDs to delete (in current but not input)
  const tagIdsToDelete =
    currentTagsData
      ?.filter((tag) => !inputTagIds.has(tag.tag_id))
      .map((t) => t.tag_id) || [];

  // Perform inserts
  if (tagsToInsert.length > 0) {
    await supabase.from("tracker_project_tags").insert(
      tagsToInsert.map((tag) => ({
        tag_id: tag.id,
        tracker_project_id: projectId!,
        team_id: params.teamId,
      })),
    );
  }

  // Perform deletes
  if (tagIdsToDelete.length > 0) {
    await supabase
      .from("tracker_project_tags")
      .delete()
      .eq("tracker_project_id", projectId!)
      .in("tag_id", tagIdsToDelete);
  }

  return result;
}

type DeleteTrackerProjectParams = {
  id: string;
};

export async function deleteTrackerProject(
  supabase: Client,
  params: DeleteTrackerProjectParams,
) {
  return supabase
    .from("tracker_projects")
    .delete()
    .eq("id", params.id)
    .select("id")
    .single();
}

type UpsertTrackerEntriesParams = {
  id?: string;
  teamId: string;
  start: string;
  stop: string;
  dates: string[];
  assigned_id: string;
  project_id: string;
  description?: string | null;
  duration: number;
};

export async function upsertTrackerEntries(
  supabase: Client,
  params: UpsertTrackerEntriesParams,
) {
  const { dates, id, teamId, ...rest } = params;
  const entries = dates.map((date) => ({
    team_id: teamId,
    ...(id ? { id } : {}),
    ...rest,
    date,
  }));

  return supabase
    .from("tracker_entries")
    .upsert(entries, {
      ignoreDuplicates: false,
    })
    .select(
      "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name, rate, currency)",
    );
}

type DeleteTrackerEntryParams = {
  id: string;
};

export async function deleteTrackerEntry(
  supabase: Client,
  params: DeleteTrackerEntryParams,
) {
  return supabase.from("tracker_entries").delete().eq("id", params.id);
}

type DeleteInboxParams = {
  id: string;
};

export async function deleteInbox(supabase: Client, params: DeleteInboxParams) {
  return supabase.from("inbox").delete().eq("id", params.id);
}

type UpsertInboxAccountParams = {
  teamId: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  lastAccessed: string;
  provider: "gmail" | "outlook";
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

type DeleteInboxAccountParams = {
  id: string;
};

export async function deleteInboxAccount(
  supabase: Client,
  params: DeleteInboxAccountParams,
) {
  return supabase
    .from("inbox_accounts")
    .delete()
    .eq("id", params.id)
    .select("id, schedule_id")
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
