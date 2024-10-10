import type { AccountType } from "@midday/supabase/types";
import type { TransactionsSchema as EngineTransaction } from "@solomon-ai/financial-engine-sdk/resources/transactions";

type TransformTransactionData = {
  transaction: EngineTransaction.Data;
  teamId: string;
  bankAccountId: string;
};

export type Transaction =
  | EngineTransaction.Data
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

export enum FinancialEngineAccountType {
  Depository = "depository",
  Credit = "credit",
  Loan = "loan",
  Investment = "investment",
  Other = "other",
}

export function getClassification(type: AccountType): FinancialEngineAccountType {
  switch (type) {
    case "depository":
      return FinancialEngineAccountType.Depository;
    case "credit":
      return FinancialEngineAccountType.Credit;
    case "loan":
      return FinancialEngineAccountType.Loan;
    case "other_asset":
      return FinancialEngineAccountType.Investment;
    case "other_liability":
      return FinancialEngineAccountType.Other;
    default:
      console.warn(`Unknown account type: ${type}. Defaulting to Depository.`);
      return FinancialEngineAccountType.Depository;
  }
}
