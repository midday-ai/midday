import { parseAsBoolean, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

export function useCustomerParams() {
  const [params, setParams] = useQueryStates({
    customerId: parseAsString,
    type: parseAsStringEnum(["details", "edit"]),
    createCustomer: parseAsBoolean,
    name: parseAsString,
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
