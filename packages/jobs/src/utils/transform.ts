import type { Database } from "@midday/supabase/types";

type TransformTransactionData = {
  transaction: Database["public"]["Tables"]["transactions"]["Row"];
  teamId: string;
  bankAccountId: string;
  notified?: boolean;
};

type Transaction = {
  name: string;
  internal_id: string;
  category_slug: string | null;
  bank_account_id: string;
  description: string | null;
  balance: number | null;
  currency: string;
  method: string | null;
  amount: number;
  team_id: string;
  date: string;
  status: "posted";
  notified?: boolean;
  counterparty_name: string | null;
  merchant_name: string | null;
};

export function transformTransaction({
  transaction,
  teamId,
  bankAccountId,
  notified,
}: TransformTransactionData): Transaction {
  return {
    name: transaction.name,
    description: transaction.description,
    date: transaction.date,
    amount: transaction.amount,
    currency: transaction.currency,
    method: transaction.method,
    internal_id: `${teamId}_${transaction.id}`,
    category_slug: transaction.category,
    bank_account_id: bankAccountId,
    balance: transaction.balance,
    team_id: teamId,
    counterparty_name: transaction.counterparty_name,
    merchant_name: transaction.merchant_name,
    // We only support posted transactions for now
    status: "posted",
    // If the transactions are being synced manually, we don't want to notify
    // And using upsert, we don't want to override the notified value
    ...(notified ? { notified } : {}),
  };
}

export function getClassification(
  type: Database["public"]["Enums"]["account_type"],
) {
  switch (type) {
    case "credit":
      return "credit";
    default:
      return "depository";
  }
}
