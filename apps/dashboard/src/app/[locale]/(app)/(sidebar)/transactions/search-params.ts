import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString,
  page: parseAsInteger.withDefault(0),
  attachments: parseAsStringLiteral(["exclude", "include"] as const),
  start: parseAsString,
  end: parseAsString,
  categories: parseAsArrayOf(parseAsString),
  tags: parseAsArrayOf(parseAsString),
  accounts: parseAsArrayOf(parseAsString),
  assignees: parseAsArrayOf(parseAsString),
  recurring: parseAsArrayOf(
    parseAsStringLiteral(["all", "weekly", "monthly", "annually"] as const),
  ),
  statuses: parseAsStringLiteral([
    "fullfilled",
    "unfulfilled",
    "excluded",
  ] as const),
});
