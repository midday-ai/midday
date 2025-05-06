import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const useTrackerFilterParamsSchema = {
  q: parseAsString,
  customers: parseAsArrayOf(parseAsString),
  status: parseAsStringLiteral(["in_progress", "completed"]),
  tags: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export function useTrackerFilterParams() {
  const [filter, setFilter] = useQueryStates(useTrackerFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadTrackerFilterParams = createLoader(
  useTrackerFilterParamsSchema,
);
