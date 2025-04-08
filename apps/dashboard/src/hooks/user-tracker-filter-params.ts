import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const userTrackerFilterParamsSchema = {
  customers: parseAsArrayOf(parseAsString),
  statuses: parseAsArrayOf(parseAsString),
  sort: parseAsString,
};

export function useUserTrackerFilterParams() {
  const [filter, setFilter] = useQueryStates(userTrackerFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadUserTrackerFilterParams = createLoader(
  userTrackerFilterParamsSchema,
);
