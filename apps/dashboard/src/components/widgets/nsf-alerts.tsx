"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function NsfAlertsWidget() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getNsfAlerts.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="NSF Alerts"
        icon={<Icons.AlertCircle className="size-4" />}
      />
    );
  }

  const nsfCount = data?.result?.totalNsfCount ?? 0;

  return (
    <BaseWidget
      title="NSF Alerts"
      icon={<Icons.AlertCircle className="size-4" />}
      description="Non-sufficient funds events across portfolio"
      actions="View NSF details"
    >
      <div className="flex flex-col gap-2">
        <h2
          className={cn(
            "text-2xl font-normal",
            nsfCount > 0 && "text-red-500",
          )}
        >
          {nsfCount}
        </h2>
      </div>
    </BaseWidget>
  );
}
