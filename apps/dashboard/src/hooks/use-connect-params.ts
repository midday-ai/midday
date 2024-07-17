import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

export function useConnectParams(initialCountryCode?: string) {
  const [params, setParams] = useQueryStates({
    step: parseAsStringEnum(["connect", "account", "gocardless"]),
    countryCode: parseAsString.withDefault(initialCountryCode ?? ""),
    provider: parseAsStringEnum(["teller", "plaid", "gocardless"]),
    token: parseAsString,
    enrollment_id: parseAsString,
    q: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
