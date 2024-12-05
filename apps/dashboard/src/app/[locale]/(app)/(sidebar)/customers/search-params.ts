import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(0),
  q: parseAsString.withDefault(""),
  sort: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
});
