import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsString,
} from "nuqs/server";

const reconciliationFilterParamsSchema = {
  q: parseAsString,
  matchStatus: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
  accounts: parseAsArrayOf(parseAsString),
  deals: parseAsArrayOf(parseAsString),
  confidenceMin: parseAsFloat,
  tab: parseAsString,
};

export function useReconciliationFilterParams() {
  const [filter, setFilter] = useQueryStates(
    reconciliationFilterParamsSchema,
  );

  return {
    filter,
    setFilter,
    hasFilters: Object.entries(filter).some(
      ([key, value]) => key !== "tab" && value !== null,
    ),
  };
}

export const loadReconciliationFilterParams = createLoader(
  reconciliationFilterParamsSchema,
);
