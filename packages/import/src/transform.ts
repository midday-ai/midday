import { capitalCase } from "change-case";
import { v4 as uuidv4 } from "uuid";
import type { Transaction } from "./types";
import { formatAmountValue, formatDate } from "./utils";

export function transform({
  transaction,
  inverted,
}: {
  transaction: Transaction;
  inverted: boolean;
}) {
  return {
    internalId: `${transaction.teamId}_${uuidv4()}`,
    teamId: transaction.teamId,
    status: "posted",
    method: "other",
    date: formatDate(transaction.date),
    amount: formatAmountValue({ amount: transaction.amount, inverted }),
    name: transaction?.description && capitalCase(transaction.description),
    manual: true,
    categorySlug:
      formatAmountValue({ amount: transaction.amount, inverted }) > 0
        ? "income"
        : null,
    bankAccountId: transaction.bankAccountId,
    currency: transaction.currency.toUpperCase(),
    notified: true,
  };
}
