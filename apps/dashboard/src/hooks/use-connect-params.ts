import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

export function useConnectParams(initialCountryCode?: string) {
  const [params, setParams] = useQueryStates({
    step: parseAsStringLiteral(["connect", "account"]),
    countryCode: parseAsString.withDefault(initialCountryCode ?? ""),
    provider: parseAsStringLiteral(["teller", "plaid", "gocardless"]),
    token: parseAsString,
    enrollment_id: parseAsString,
    institution_id: parseAsString,
    q: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    error: parseAsString,
    ref: parseAsString,
    details: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
