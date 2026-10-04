import type { bankAccounts, transactions } from "@midday/db/schema";
import { transactionMethodsEnum } from "@midday/db/schema";

type ProviderTransaction = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  amount: number;
  currency: string;
  method: string | null;
  category: string | null;
  balance: number | null;
  counterparty_name: string | null;
  merchant_name: string | null;
};

export function transformTransaction({
  transaction,
  teamId,
  bankAccountId,
  notified,
}: {
  transaction: ProviderTransaction;
  teamId: string;
  bankAccountId: string;
  notified?: boolean;
}): typeof transactions.$inferInsert {
  const method =
    transactionMethodsEnum.enumValues.find(
      (value) => value === transaction.method,
    ) ?? "unknown";
  return {
    name: transaction.name,
    description: transaction.description,
    date: transaction.date,
    amount: transaction.amount,
    currency: transaction.currency,
    method,
    internalId: `${teamId}_${transaction.id}`,
    categorySlug: transaction.category,
    bankAccountId,
    balance: transaction.balance,
    teamId,
    counterpartyName: transaction.counterparty_name,
    merchantName: transaction.merchant_name,
    status: "posted",
    // Preserve existing notified values when a sync is not explicitly manual.
    ...(notified ? { notified } : {}),
  };
}

export function getClassification(type: typeof bankAccounts.$inferSelect.type) {
  return type === "credit" ? "credit" : "depository";
}
