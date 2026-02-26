import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useDealParams() {
  const [params, setParams] = useQueryStates({
    dealId: parseAsString,
    createDeal: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
