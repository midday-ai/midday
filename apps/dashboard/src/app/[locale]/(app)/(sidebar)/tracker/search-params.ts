import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  customers: parseAsArrayOf(parseAsString),
  statuses: parseAsArrayOf(parseAsString),
  sort: parseAsString,
});
