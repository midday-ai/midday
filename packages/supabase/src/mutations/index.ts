import { addDays } from "date-fns";
import { getSession, getUserDetails } from "../queries";
import { Client } from "../types";
import { remove } from "../utils/storage";

export async function createBankAccounts(supabase: Client, accounts) {
  const { data: userData } = await getUserDetails(supabase);
  // Get first account to create a bank connection
  const bankConnection = await createBankConnection(supabase, {
    ...accounts.at(0).bank,
    team_id: userData?.team_id,
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
        bban: account.bban,
        iban: account.iban,
        bic: account.bic,
        currency: account.currency,
        owner_name: account.owner_name,
      })),
    )
    .select();
}

export async function createBankConnection(supabase: Client, bank: any) {
  return await supabase
    .from("bank_connections")
    .insert({
      ...bank,
      expires_at: addDays(new Date(), 180).toDateString(),
      provider: "gocardless",
    })
    .select()
    .single();
}

export async function createTransactions(supabase: Client, transactions) {
  const { data: userData } = await getUserDetails(supabase);

  const { data } = await supabase.from("transactions").insert(
    transactions.map((transaction) => ({
      ...transaction,
      team_id: userData.team_id,
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
  return await supabase.from("bank_accounts").delete().eq("id", id);
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
