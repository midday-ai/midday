import { useQueryState } from "nuqs";
import { createLoader, parseAsStringLiteral } from "nuqs/server";

export const transactionTabSchema = {
  tab: parseAsStringLiteral(["all", "review"] as const).withDefault("all"),
};

export function useTransactionTab() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["all", "review"] as const).withDefault("all"),
  );

  return { tab, setTab };
}

export const loadTransactionTab = createLoader(transactionTabSchema);
