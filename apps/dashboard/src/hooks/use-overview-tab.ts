"use client";

import { useQueryState } from "nuqs";
import { useMemo } from "react";

export function useOverviewTab() {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "overview",
  });

  const isMetricsTab = useMemo(() => {
    return tab === "metrics";
  }, [tab]);

  return {
    tab: tab ?? "overview",
    setTab,
    isMetricsTab,
  };
}
