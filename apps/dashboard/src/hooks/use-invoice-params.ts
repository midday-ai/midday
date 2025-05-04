import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringEnum } from "nuqs/server";

const invoiceParamsSchema = {
  selectedCustomerId: parseAsString,
  type: parseAsStringEnum(["edit", "create", "details", "comments"]),
  invoiceId: parseAsString,
};

export function useInvoiceParams() {
  const [params, setParams] = useQueryStates(invoiceParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadInvoiceParams = createLoader(invoiceParamsSchema);
