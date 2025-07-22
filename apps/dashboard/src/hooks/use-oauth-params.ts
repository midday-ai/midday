import { useQueryStates } from "nuqs";
import { createLoader, parseAsString } from "nuqs/server";

export const oauthParamsSchema = {
  response_type: parseAsString,
  client_id: parseAsString,
  redirect_uri: parseAsString,
  scope: parseAsString,
  state: parseAsString,
  code_challenge: parseAsString,
};

export function useOAuthParams() {
  const [params, setParams] = useQueryStates(oauthParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadOAuthParams = createLoader(oauthParamsSchema);
