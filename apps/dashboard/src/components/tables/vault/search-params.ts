import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString,
  start: parseAsString,
  end: parseAsString,
  owners: parseAsArrayOf(parseAsString),
  tags: parseAsArrayOf(parseAsString),
});
