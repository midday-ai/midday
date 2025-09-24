import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useProductParams() {
  const [params, setParams] = useQueryStates({
    productId: parseAsString,
    createProduct: parseAsBoolean,
    name: parseAsString,
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
