"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-500/10", text: "text-green-600" },
  late: { bg: "bg-amber-500/10", text: "text-amber-600" },
  paid_off: { bg: "bg-blue-500/10", text: "text-blue-600" },
  defaulted: { bg: "bg-red-500/10", text: "text-red-600" },
  paused: { bg: "bg-yellow-500/10", text: "text-yellow-600" },
  in_collections: { bg: "bg-red-500/10", text: "text-red-600" },
};

const STATUS_LABELS: Record<string, string> = {
  active: "active",
  late: "late",
  paid_off: "paid off",
  defaulted: "defaulted",
  paused: "paused",
  in_collections: "collections",
};

export function DealPipelineWidget() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getDealPipeline.queryOptions({}),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Deal Pipeline"
        icon={<Icons.Speed className="size-4" />}
      />
    );
  }

  const breakdown = data?.result ?? {};
  const totalDeals = Object.values(breakdown).reduce(
    (sum, count) => sum + (count as number),
    0,
  );

  return (
    <BaseWidget
      title="Deal Pipeline"
      icon={<Icons.Speed className="size-4" />}
      description={`Status distribution across ${totalDeals} deals`}
      actions="View pipeline"
    >
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(breakdown)
          .filter(([, count]) => (count as number) > 0)
          .map(([status, count]) => {
            const style = STATUS_STYLES[status] ?? {
              bg: "bg-gray-500/10",
              text: "text-gray-600",
            };
            return (
              <span
                key={status}
                className={`text-xs px-2 py-0.5 rounded ${style.bg} ${style.text}`}
              >
                {count} {STATUS_LABELS[status] ?? status}
              </span>
            );
          })}
      </div>
    </BaseWidget>
  );
}
