import { useQueryState } from "nuqs";
import { createLoader, parseAsStringLiteral } from "nuqs/server";

const TAB_VALUES = ["all", "review", "syndication"] as const;

export const transactionTabSchema = {
  tab: parseAsStringLiteral(TAB_VALUES).withDefault("all"),
};

export function useTransactionTab() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TAB_VALUES).withDefault("all"),
  );

  return { tab, setTab };
}

export const loadTransactionTab = createLoader(transactionTabSchema);
