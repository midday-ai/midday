import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

const invoiceFilterParamsSchema = {
  sort: parseAsArrayOf(parseAsString),
  q: parseAsString,
  statuses: parseAsArrayOf(parseAsString),
  customers: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export function useInvoiceFilterParams() {
  const [filter, setFilter] = useQueryStates(invoiceFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadInvoiceFilterParams = createLoader(invoiceFilterParamsSchema);
