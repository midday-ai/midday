import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { createSearchParamsCache } from "nuqs/server";

export const sortParamsSchema = {
  sort: parseAsArrayOf(parseAsString),
};

export function useSortParams() {
  const [params, setParams] = useQueryStates(sortParamsSchema);

  return { params, setParams };
}

export const sortParamsCache = createSearchParamsCache(sortParamsSchema);
