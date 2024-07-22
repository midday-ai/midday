import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

export function useConnectParams(initialCountryCode?: string) {
  const [params, setParams] = useQueryStates({
    step: parseAsStringEnum(["connect", "account"]),
    countryCode: parseAsString.withDefault(initialCountryCode ?? ""),
    provider: parseAsStringEnum(["teller", "plaid", "gocardless"]),
    token: parseAsString,
    enrollment_id: parseAsString,
    institution_id: parseAsString,
    q: parseAsString,
    error: parseAsString,
    ref: parseAsString,
    details: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
