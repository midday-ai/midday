import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringEnum } from "nuqs/server";

const invoiceParamsSchema = {
  selectedMerchantId: parseAsString,
  type: parseAsStringEnum(["edit", "create", "details", "success"]),
  invoiceId: parseAsString,
  editRecurringId: parseAsString,
};

export function useInvoiceParams() {
  const [params, setParams] = useQueryStates(invoiceParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadInvoiceParams = createLoader(invoiceParamsSchema);
