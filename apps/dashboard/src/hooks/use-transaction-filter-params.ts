import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { createSearchParamsCache } from "nuqs/server";

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
  amount: parseAsArrayOf(parseAsInteger),
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
  };
}

export const transactionFilterParamsCache = createSearchParamsCache(
  transactionFilterParamsSchema,
);
