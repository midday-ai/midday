import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from "nuqs/server";

const dealFilterParamsSchema = {
  q: parseAsString,
  statuses: parseAsArrayOf(parseAsString),
  merchants: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
  ids: parseAsArrayOf(parseAsString),
  recurringIds: parseAsArrayOf(parseAsString),
  recurring: parseAsBoolean,
};

export function useDealFilterParams() {
  const [filter, setFilter] = useQueryStates(dealFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadDealFilterParams = createLoader(dealFilterParamsSchema);
