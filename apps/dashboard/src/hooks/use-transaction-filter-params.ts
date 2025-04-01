import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const transactionFilterParamsSchema = {
  q: parseAsString,
  attachments: parseAsStringLiteral(["exclude", "include"] as const),
  start: parseAsString,
  end: parseAsString,
  categories: parseAsArrayOf(parseAsString),
  tags: parseAsArrayOf(parseAsString),
  accounts: parseAsArrayOf(parseAsString),
  assignees: parseAsArrayOf(parseAsString),
  amount_range: parseAsArrayOf(parseAsInteger),
  amount: parseAsArrayOf(parseAsString),
  recurring: parseAsArrayOf(
    parseAsStringLiteral(["all", "weekly", "monthly", "annually"] as const),
  ),
  statuses: parseAsArrayOf(
    parseAsStringLiteral([
      "completed",
      "uncompleted",
      "archived",
      "excluded",
    ] as const),
  ),
};

export function useTransactionFilterParams() {
  const [filter, setFilter] = useQueryStates(transactionFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadTransactionFilterParams = createLoader(
  transactionFilterParamsSchema,
);
