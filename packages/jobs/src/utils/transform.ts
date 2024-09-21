import type { Transaction as EngineTransaction } from "@midday/engine/src/providers/types.js";
import type { Database } from "@midday/supabase/types";
import type { Transactions } from "@solomon-ai/financial-engine-sdk/resources/transactions";

type TransformTransactionData = {
  transaction: EngineTransaction;
  teamId: string;
  bankAccountId: string;
};

export type Transaction =
  | EngineTransaction
  | {
      team_id: string;
    };

export function transformTransaction({
  transaction,
  teamId,
  bankAccountId,
}: TransformTransactionData): Transaction {
  const { id, category, ...transactionWithoutId } = transaction;
  const currentTransaction: Transaction = {
    ...transactionWithoutId,
    internal_id: `${teamId}_${id}`,
    balance: transaction.balance,
    team_id: teamId,
    bank_account_id: bankAccountId,
    category_slug: category || "other",
  };

  return currentTransaction;
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
