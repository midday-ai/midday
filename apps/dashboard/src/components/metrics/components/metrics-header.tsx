"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { AnalyticsFilter } from "./analytics-filter";

interface MetricsHeaderProps {
  isCustomizing: boolean;
  onCustomizeToggle: () => void;
}

export function MetricsHeader({
  isCustomizing,
  onCustomizeToggle,
}: MetricsHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-6">
      <div>
        <h1 className="text-2xl font-normal mb-1 font-serif">Metrics</h1>
      </div>
      <div className="flex items-center gap-2">
        <AnalyticsFilter />

        <Button
          variant="outline"
          size="icon"
          onClick={onCustomizeToggle}
          data-no-close
          className="h-9 w-9"
        >
          {isCustomizing ? (
            <Icons.Check size={16} />
          ) : (
            <Icons.DashboardCustomize size={16} />
          )}
        </Button>
      </div>
    </div>
  );
}
