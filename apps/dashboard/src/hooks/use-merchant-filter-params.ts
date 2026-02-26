import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const merchantFilterParamsSchema = {
  q: parseAsString,
  sort: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export function useMerchantFilterParams() {
  const [filter, setFilter] = useQueryStates(merchantFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadMerchantFilterParams = createLoader(
  merchantFilterParamsSchema,
);
