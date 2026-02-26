import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const collectionsFilterParamsSchema = {
  q: parseAsString,
  sort: parseAsArrayOf(parseAsString),
  status: parseAsString,
  stage: parseAsString,
  assignedTo: parseAsString,
  priority: parseAsString,
  tab: parseAsString,
};

export function useCollectionsFilterParams() {
  const [filter, setFilter] = useQueryStates(collectionsFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadCollectionsFilterParams = createLoader(
  collectionsFilterParamsSchema,
);
