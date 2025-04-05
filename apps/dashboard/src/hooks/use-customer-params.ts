import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryStates,
} from "nuqs";

export function useCustomerParams() {
  const [params, setParams] = useQueryStates({
    customerId: parseAsString,
    createCustomer: parseAsBoolean,
    sort: parseAsArrayOf(parseAsString),
    name: parseAsString,
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
