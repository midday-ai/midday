import crypto from "node:crypto";
import { capitalCase } from "change-case";
import type { Transaction } from "./types";
import { formatAmountValue, formatDate } from "./utils";

export function generateId(value: string) {
  const hash = crypto.createHash("sha256");
  hash.update(value);

  return hash.digest("hex");
}

export function transform({
  transaction,
  inverted,
}: { transaction: Transaction; inverted: boolean }) {
  const internalId = generateId(
    `${transaction.date}-${transaction.description}`,
  );

  return {
    internal_id: `${transaction.teamId}_${internalId}`,
    team_id: transaction.teamId,
    status: "posted",
    method: "other",
    date: formatDate(transaction.date),
    amount: formatAmountValue({ amount: transaction.amount, inverted }),
    name: transaction?.description && capitalCase(transaction.description),
    manual: true,
    category_slug:
      formatAmountValue({ amount: transaction.amount, inverted }) > 0
        ? "income"
        : null,
    bank_account_id: transaction.bankAccountId,
    currency: transaction.currency,
  };
}
