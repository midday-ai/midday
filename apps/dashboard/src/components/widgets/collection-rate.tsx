"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function CollectionRateWidget() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getCollectionRate.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Collection Rate"
        icon={<Icons.ShowChart className="size-4" />}
      />
    );
  }

  const collectionRate = data?.result?.collectionRate ?? 0;

  return (
    <BaseWidget
      title="Collection Rate"
      icon={<Icons.ShowChart className="size-4" />}
      description="Percentage of expected payback collected"
      actions="View collection details"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">{collectionRate}%</h2>
      </div>
    </BaseWidget>
  );
}
