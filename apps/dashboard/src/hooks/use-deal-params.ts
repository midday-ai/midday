import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringEnum } from "nuqs/server";

const dealParamsSchema = {
  selectedMerchantId: parseAsString,
  type: parseAsStringEnum(["edit", "create", "details", "success"]),
  dealId: parseAsString,
  editRecurringId: parseAsString,
};

export function useDealParams() {
  const [params, setParams] = useQueryStates(dealParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadDealParams = createLoader(dealParamsSchema);
