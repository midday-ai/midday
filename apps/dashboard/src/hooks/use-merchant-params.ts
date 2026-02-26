import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useMerchantParams() {
  const [params, setParams] = useQueryStates({
    merchantId: parseAsString,
    createMerchant: parseAsBoolean,
    name: parseAsString,
    q: parseAsString,
    details: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
