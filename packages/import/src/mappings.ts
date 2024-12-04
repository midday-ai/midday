import type { Transaction } from "./types";

export const mapTransactions = (
  data: Record<string, string>[],
  mappings: Record<string, string>,
  currency: string,
  teamId: string,
  bankAccountId: string,
): Transaction[] => {
  return data.map((row) => ({
    ...(Object.fromEntries(
      Object.entries(mappings)
        .filter(([_, value]) => value !== "")
        .map(([key, value]) => [key, row[value]]),
    ) as Transaction),
    currency,
    teamId,
    bankAccountId,
  }));
};
