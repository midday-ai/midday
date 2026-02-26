"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function ActiveDealsWidget() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getActiveDeals.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Active Deals"
        icon={<Icons.ListAlt className="size-4" />}
      />
    );
  }

  const activeDeals = data?.result?.activeDeals ?? 0;
  const totalDeals = data?.result?.totalDeals ?? 0;

  return (
    <BaseWidget
      title="Active Deals"
      icon={<Icons.ListAlt className="size-4" />}
      description={`${activeDeals} of ${totalDeals} deals currently active`}
      actions="View active deals"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">{activeDeals}</h2>
      </div>
    </BaseWidget>
  );
}
