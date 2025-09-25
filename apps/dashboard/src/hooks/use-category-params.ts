import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useCategoryParams() {
  const [params, setParams] = useQueryStates({
    categoryId: parseAsString,
    createCategory: parseAsBoolean,
    name: parseAsString,
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
