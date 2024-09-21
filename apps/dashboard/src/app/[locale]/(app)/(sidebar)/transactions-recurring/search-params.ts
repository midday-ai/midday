import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const searchParamsCacheRecurring = createSearchParamsCache({
  q: parseAsString,
  page: parseAsInteger.withDefault(0),
  recurring: parseAsStringLiteral([
    "all",
    "weekly",
    "monthly",
    "annually",
  ] as const).withDefault("all"),
  attachments: parseAsStringLiteral(["exclude", "include"] as const),
  start: parseAsString,
  end: parseAsString,
  categories: parseAsArrayOf(parseAsString),
  accounts: parseAsArrayOf(parseAsString),
  assignees: parseAsArrayOf(parseAsString),
  statuses: parseAsStringLiteral([
    "fullfilled",
    "unfulfilled",
    "excluded",
  ] as const),
});
