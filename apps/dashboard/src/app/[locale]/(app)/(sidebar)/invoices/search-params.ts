import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  sort: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
  statuses: parseAsArrayOf(parseAsString),
  customers: parseAsArrayOf(parseAsString),
});
