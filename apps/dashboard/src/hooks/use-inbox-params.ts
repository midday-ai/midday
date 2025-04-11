import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const TAB_ITEMS = ["todo", "done"] as const;

export const inboxParamsSchema = {
  tab: parseAsStringLiteral(TAB_ITEMS).withDefault("todo"),
  inboxId: parseAsString,
  order: parseAsStringLiteral(["asc", "desc"]).withDefault("asc"),
};

export function useInboxParams() {
  const [params, setParams] = useQueryStates(inboxParamsSchema);

  return {
    params,
    setParams,
  };
}

export const loadInboxParams = createLoader(inboxParamsSchema);
