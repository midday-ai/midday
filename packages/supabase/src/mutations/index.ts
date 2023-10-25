import { getUserDetails } from "../queries";
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
        logo_url: account.logo_url,
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
  // TODO: Fix RLS
  try {
    await supabase.from("transactions").update(data).eq("id", id);
  } catch (err) {
    console.log(err);
  }
}

export type Attachment = {
  type: string;
  name: string;
  size: number;
  url: string;
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

  console.log(`documents/${data.team?.id}/transactions/${data.transaction_id}`);

  remove(supabase, {
    path: `documents/${data.team?.id}/transactions/${data.transaction_id}`,
    file: data.name,
  });

  return data;
}
