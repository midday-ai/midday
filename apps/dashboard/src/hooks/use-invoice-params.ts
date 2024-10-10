import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryStates,
} from "nuqs";

export function useInvoiceParams(options?: { shallow: boolean }) {
  const [params, setParams] = useQueryStates(
    {
      invoiceId: parseAsString,
      createInvoice: parseAsBoolean,
      sort: parseAsArrayOf(parseAsString),
      q: parseAsString,
      statuses: parseAsArrayOf(parseAsString),
      customers: parseAsArrayOf(parseAsString),
      start: parseAsString,
      end: parseAsString,
    },
    options,
  );

  return {
    ...params,
    setParams,
  };
}
