import { parseAsString, useQueryStates } from "nuqs";

export function useInvoiceParams() {
  const [params, setParams] = useQueryStates({
    invoiceId: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
