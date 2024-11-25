import type { Transactions } from "@midday-ai/engine/resources/transactions";
import type { Database } from "@midday/supabase/types";

type TransformTransactionData = {
  transaction: Transactions.Data;
  teamId: string;
  bankAccountId: string;
  processed: boolean;
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
  status: "posted" | "pending";
  processed: boolean;
};

export function transformTransaction({
  transaction,
  teamId,
  bankAccountId,
  processed,
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
    status: transaction.status,
    processed,
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
