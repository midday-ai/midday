import { addDays } from "date-fns";
import {
  getCurrentUserTeamQuery,
  getSession,
  getUserInviteQuery,
} from "../queries";
import { Client, Database } from "../types";

export async function createBankAccounts(supabase: Client, accounts) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);
  // Get first account to create a bank connection
  const account = accounts?.at(0);

  const bankConnection = await createBankConnection(supabase, {
    institution_id: account.institution_id,
    name: account.bank_name,
    logo_url: account.logo_url,
    team_id: userData?.team_id,
    provider: account.provider,
  });

  return supabase
    .from("bank_accounts")
    .insert(
      accounts.map((account) => ({
        account_id: account.account_id,
        bank_connection_id: bankConnection?.data?.id,
        team_id: userData?.team_id,
        created_by: userData.id,
        name: account.name,
        currency: account.currency,
      }))
    )
    .select();
}

type CreateBankConnectionPayload = {
  institution_id: string;
  team_id: string;
  name: string;
  logo_url: string;
  provider: "gocardless" | "plaid" | "teller";
};

export async function createBankConnection(
  supabase: Client,
  data: CreateBankConnectionPayload
) {
  return await supabase
    .from("bank_connections")
    .insert({
      ...data,
      expires_at: addDays(new Date(), 180).toDateString(),
    })
    .select()
    .single();
}

type UpdateBankConnectionData = {
  id: string;
  teamId: string;
};

export async function updateBankConnection(
  supabase: Client,
  data: UpdateBankConnectionData
) {
  const { id, teamId } = data;

  return await supabase
    .from("bank_connections")
    .update({
      expires_at: addDays(new Date(), 180).toDateString(),
    })
    .eq("team_id", teamId)
    .eq("id", id)
    .select();
}

type CreateTransactionsData = {
  transactions: any[];
  teamId: string;
};

export async function createTransactions(
  supabase: Client,
  data: CreateTransactionsData
) {
  const { transactions, teamId } = data;

  return supabase.from("transactions").insert(
    transactions.map((transaction) => ({
      ...transaction,
      team_id: teamId,
    }))
  );
}

export async function updateTransaction(
  supabase: Client,
  id: string,
  data: any
) {
  return supabase
    .from("decrypted_transactions")
    .update(data)
    .eq("id", id)
    .select("id, category, team_id, name:decrypted_name")
    .single();
}

export async function updateUser(supabase: Client, data: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabase
    .from("users")
    .update(data)
    .eq("id", user?.id)
    .select()
    .single();
}

export async function deleteUser(supabase: Client) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.admin.deleteUser(user.id);
  // TODO: Delete files etc
  await supabase.from("users").delete().eq("id", user.id);
  await supabase.auth.signOut();

  return user.id;
}

export async function updateTeam(supabase: Client, data: any) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);
  return supabase
    .from("teams")
    .update(data)
    .eq("id", userData?.team_id)
    .select();
}

type UpdateUserTeamRoleParams = {
  role: "owner" | "member";
  userId: string;
  teamId: string;
};

export async function updateUserTeamRole(
  supabase: Client,
  params: UpdateUserTeamRoleParams
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

export async function deleteTeam(supabase: Client, teamId: string) {
  return supabase.from("teams").delete().eq("id", teamId);
}

type DeleteTeamMemberParams = {
  userId: string;
  teamId: string;
};

export async function deleteTeamMember(
  supabase: Client,
  params: DeleteTeamMemberParams
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
};

export async function updateBankAccount(
  supabase: Client,
  params: UpdateBankAccountParams
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

export async function updateSimilarTransactions(supabase: Client, id: string) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  const transaction = await supabase
    .from("decrypted_transactions")
    .select("name:decrypted_name, category")
    .eq("id", id)
    .single();

  return supabase
    .from("decrypted_transactions")
    .update({ category: transaction.data.category })
    .eq("decrypted_name", transaction.data.name)
    .eq("team_id", userData?.team_id)
    .select("id, team_id");
}

export type Attachment = {
  type: string;
  name: string;
  size: number;
  path: string;
  transaction_id: string;
};

export async function createAttachments(
  supabase: Client,
  attachments: Attachment[]
) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  const { data } = await supabase
    .from("transaction_attachments")
    .insert(
      attachments.map((attachment) => ({
        ...attachment,
        team_id: userData?.team_id,
      }))
    )
    .select();

  return data;
}

type CreateEnrichmentTransactionParams = {
  name: string;
  category: Database["public"]["Enums"]["transactionCategories"];
};

export async function createEnrichmentTransaction(
  supabase: Client,
  params: CreateEnrichmentTransactionParams
) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  const { data } = await supabase
    .from("transaction_enrichments")
    .insert({
      name: params.name,
      category: params.category,
      created_by: userData?.id,
    })
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
};

export async function createTeam(supabase: Client, params: CreateTeamParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: teamData } = await supabase
    .from("teams")
    .insert({
      name: params.name,
    })
    .select()
    .single();

  const { data: userData } = await supabase
    .from("users_on_team")
    .insert({
      user_id: user.id,
      team_id: teamData?.id,
      role: "owner",
    })
    .select()
    .single();

  return {
    ...teamData,
    ...userData,
  };
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
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inviteData } = await getUserInviteQuery(supabase, {
    code,
    email: user?.email,
  });

  if (inviteData) {
    // Add user team
    await supabase.from("users_on_team").insert({
      user_id: user.id,
      team_id: inviteData?.team_id,
      role: inviteData.role,
    });

    // Set current team
    const { data } = await supabase
      .from("users")
      .update({
        team_id: inviteData?.team_id,
      })
      .eq("id", user.id)
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
  read?: boolean;
  status?: "completed" | "archived";
  attachment_id?: string;
  transaction_id?: string;
};

export async function updateInboxById(
  supabase: Client,
  params: UpdateInboxByIdParams
) {
  const { id, ...data } = params;

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
};

export async function createProject(
  supabase: Client,
  params: CreateProjectParams
) {
  const { data: userData } = await getCurrentUserTeamQuery(supabase);

  return supabase
    .from("tracker_projects")
    .insert({
      ...params,
      team_id: userData?.team_id,
    })
    .select()
    .single();
}
