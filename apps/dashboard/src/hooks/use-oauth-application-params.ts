import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useOAuthApplicationParams() {
  const [params, setParams] = useQueryStates({
    applicationId: parseAsString,
    createApplication: parseAsBoolean,
    editApplication: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
