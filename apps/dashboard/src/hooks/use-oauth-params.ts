import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const oauthParamsSchema = {
  client_id: parseAsString,
  redirect_uri: parseAsString,
  scope: parseAsString,
  state: parseAsString,
  code_challenge: parseAsString,
  code_challenge_method: parseAsStringLiteral(["S256", "plain"]),
};

export function useOAuthParams() {
  const [params, setParams] = useQueryStates(oauthParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadOAuthParams = createLoader(oauthParamsSchema);
