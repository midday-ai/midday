import { getSession, getUserDetails } from "../queries";
import { Client } from "../types";
import { remove } from "../utils/storage";

export async function createTeamBankAccounts(supabase: Client, accounts) {
  const { data: userData } = await getUserDetails(supabase);

  const { data } = await supabase
    .from("bank_accounts")
    .insert(
      accounts.map((account) => ({
        account_id: account.id,
        bank_name: account.bank_name,
        name: account.name,
        logo_url: account.logo_url,
        bban: account.bban,
        bic: account.bic,
        currency: account.currency,
        details: account.details,
        display_name: account.displayName,
        iban: account.iban,
        linked_accounts: account.linkedAccounts,
        created_by: userData?.id,
        team_id: userData?.team_id,
        provider: "gocardless",
      })),
    )
    .select();

  return data;
}

export async function createTransactions(supabase: Client, transactions) {
  const { data: userData } = await getUserDetails(supabase);

  const { data } = await supabase.from("transactions").insert(
    transactions.map((transaction) => ({
      ...transaction,
      team_id: userData?.team_id,
    })),
  );

  return data;
}

export async function updateTransaction(
  supabase: Client,
  id: string,
  data: any,
) {
  return supabase.from("transactions").update(data).eq("id", id);
}

export async function updateUser(supabase: Client, data: any) {
  const { data: userData } = await getUserDetails(supabase);
  return supabase.from("users").update(data).eq("id", userData?.id).select();
}

export async function deleteUser(supabase: Client) {
  const {
    data: { session },
  } = await getSession(supabase);
  // await supabase.auth.admin.deleteUser(session?.user.id);
  // TODO: Delete files etc
  await supabase.from("users").delete().eq("id", session?.user.id);
  await supabase.auth.signOut();
}

export async function updateTeam(supabase: Client, data: any) {
  const { data: userData } = await getUserDetails(supabase);
  return supabase
    .from("teams")
    .update(data)
    .eq("id", userData?.team_id)
    .select();
}

export async function deleteTeam(supabase: Client) {
  const { data: userData } = await getUserDetails(supabase);
  return supabase.from("teams").delete().eq("id", userData?.team_id);
}

export async function deleteBankAccount(supabase: Client, id: string) {
  try {
    const { data, error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", id);
    console.log(error);
  } catch (err) {
    console.log(err);
  }
}

export async function updateSimilarTransactions(supabase: Client, id: string) {
  const { data: userData } = await getUserDetails(supabase);

  const transaction = await supabase
    .from("transactions")
    .select("name, category")
    .eq("id", id)
    .single();

  await supabase
    .from("transactions")
    .update({ category: transaction.data.category })
    .eq("name", transaction.data.name)
    .eq("team_id", userData?.team_id)
    .is("category", null);
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
  attachments: Attachment[],
) {
  const { data: userData } = await getUserDetails(supabase);

  const { data } = await supabase
    .from("attachments")
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
    .from("attachments")
    .delete()
    .eq("id", id)
    .select("id, transaction_id, name, team:team_id(id)")
    .single();

  remove(supabase, {
    bucket: "documents",
    path: `${data.team?.id}/transactions/${data.transaction_id}/${data.name}`,
  });

  return data;
}
