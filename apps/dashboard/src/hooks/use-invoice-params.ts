import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryStates,
} from "nuqs";

export function useInvoiceParams() {
  const [params, setParams] = useQueryStates({
    invoiceId: parseAsString,
    create: parseAsBoolean,
    sort: parseAsArrayOf(parseAsString),
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
