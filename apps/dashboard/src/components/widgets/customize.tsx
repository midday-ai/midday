"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { usePathname } from "next/navigation";
import { useMetricsCustomize } from "@/hooks/use-metrics-customize";
import { useOverviewTab } from "@/hooks/use-overview-tab";
import { useIsCustomizing, useWidgetActions } from "./widget-provider";

export function Customize() {
  const pathname = usePathname();
  const { isMetricsTab } = useOverviewTab();
  const widgetsIsCustomizing = useIsCustomizing();
  const { setIsCustomizing: setWidgetsCustomizing } = useWidgetActions();
  const {
    isCustomizing: metricsIsCustomizing,
    setIsCustomizing: setMetricsCustomizing,
  } = useMetricsCustomize();

  const isOnRootPath = pathname === "/" || pathname === "";

  if (!isOnRootPath) {
    return null;
  }

  const isCustomizing = isMetricsTab
    ? metricsIsCustomizing
    : widgetsIsCustomizing;

  const handleToggle = () => {
    if (isMetricsTab) {
      setMetricsCustomizing(!metricsIsCustomizing);
    } else {
      setWidgetsCustomizing(!widgetsIsCustomizing);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9"
      onClick={handleToggle}
    >
      {isCustomizing ? (
        <Icons.Check size={16} />
      ) : (
        <Icons.DashboardCustomize size={16} />
      )}
    </Button>
  );
}
