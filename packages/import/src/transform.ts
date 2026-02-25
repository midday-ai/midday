import { createHash } from "node:crypto";
import { capitalCase } from "change-case";
import type { Transaction } from "./types";
import { formatAmountValue, formatDate } from "./utils";

function normalizeFingerprintValue(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildDeterministicInternalId({
  transaction,
  normalizedDescription,
  normalizedCounterparty,
  formattedDate,
  formattedAmount,
}: {
  transaction: Transaction;
  normalizedDescription?: string;
  normalizedCounterparty?: string;
  formattedDate?: string;
  formattedAmount: number;
}) {
  const fingerprint = [
    normalizeFingerprintValue(transaction.bankAccountId),
    normalizeFingerprintValue(formattedDate),
    String(formattedAmount),
    normalizeFingerprintValue(transaction.currency.toUpperCase()),
    normalizeFingerprintValue(normalizedDescription),
    normalizeFingerprintValue(normalizedCounterparty),
  ].join("|");

  const hash = createHash("sha256")
    .update(fingerprint)
    .digest("hex")
    .slice(0, 24);

  return `${transaction.teamId}_${hash}`;
}

export function transform({
  transaction,
  inverted,
}: {
  transaction: Transaction;
  inverted: boolean;
}) {
  const normalizedDescription = transaction.description?.trim();
  const normalizedCounterparty = transaction.counterparty?.trim();
  const formattedDate = formatDate(transaction.date);
  const formattedAmount = formatAmountValue({
    amount: transaction.amount,
    inverted,
  });

  return {
    internal_id: buildDeterministicInternalId({
      transaction,
      normalizedDescription,
      normalizedCounterparty,
      formattedDate,
      formattedAmount,
    }),
    team_id: transaction.teamId,
    status: "posted",
    method: "other",
    date: formattedDate,
    amount: formattedAmount,
    name: capitalCase(
      normalizedDescription || normalizedCounterparty || "Transaction",
    ),
    counterparty_name: normalizedCounterparty
      ? capitalCase(normalizedCounterparty)
      : null,
    manual: true,
    category_slug:
      formatAmountValue({ amount: transaction.amount, inverted }) > 0
        ? "income"
        : null,
    bank_account_id: transaction.bankAccountId,
    currency: transaction.currency.toUpperCase(),
    notified: true,
  };
}
