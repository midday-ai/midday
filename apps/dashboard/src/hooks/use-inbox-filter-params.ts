import { useQueryStates } from "nuqs";
import { createLoader, parseAsBoolean, parseAsString } from "nuqs/server";

export const inboxFilterParamsSchema = {
  q: parseAsString,
};

export function useInboxFilterParams() {
  const [params, setParams] = useQueryStates(inboxFilterParamsSchema);

  return {
    params,
    setParams,
  };
}

export const loadInboxFilterParams = createLoader(inboxFilterParamsSchema);
