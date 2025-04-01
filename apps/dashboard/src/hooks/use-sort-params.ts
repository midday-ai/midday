import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const sortParamsSchema = {
  sort: parseAsArrayOf(parseAsString),
};

export function useSortParams() {
  const [params, setParams] = useQueryStates(sortParamsSchema);

  return { params, setParams };
}

export const loadSortParams = createLoader(sortParamsSchema);
