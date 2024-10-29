import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

export function useInvoiceParams(options?: { shallow: boolean }) {
  const [params, setParams] = useQueryStates(
    {
      invoiceId: parseAsString,
      sort: parseAsArrayOf(parseAsString),
      q: parseAsString,
      statuses: parseAsArrayOf(parseAsString),
      customers: parseAsArrayOf(parseAsString),
      start: parseAsString,
      end: parseAsString,
      selectedCustomerId: parseAsString,
      type: parseAsStringEnum([
        "edit",
        "create",
        "details",
        "duplicate",
        "comments",
      ]),
    },
    options,
  );

  return {
    ...params,
    setParams,
  };
}
