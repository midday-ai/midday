import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryStates,
} from "nuqs";

export function useCustomerParams(options?: { shallow: boolean }) {
  const [params, setParams] = useQueryStates(
    {
      customerId: parseAsString,
      createCustomer: parseAsBoolean,
      sort: parseAsArrayOf(parseAsString),
      name: parseAsString,
      q: parseAsString,
    },
    options,
  );

  return {
    ...params,
    setParams,
  };
}
