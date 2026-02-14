import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { startTransition } from "react";

export const inboxFilterParamsSchema = {
  q: parseAsString,
  status: parseAsStringLiteral([
    "done",
    "pending",
    "suggested_match",
    "no_match",
    "other",
  ]),
  tab: parseAsStringLiteral(["all", "other"]),
};

export function useInboxFilterParams() {
  const [params, setParams] = useQueryStates(inboxFilterParamsSchema, {
    startTransition,
  });

  return {
    params,
    setParams,
    // Exclude 'tab' from filter check since it's a navigation param, not a filter
    hasFilter: Object.entries(params).some(
      ([key, value]) => key !== "tab" && value !== null,
    ),
  };
}

export const loadInboxFilterParams = createLoader(inboxFilterParamsSchema);
