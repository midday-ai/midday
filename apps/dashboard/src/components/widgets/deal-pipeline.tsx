"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-[#DDF1E4] dark:bg-[#00C969]/10", text: "text-[#00C969]" },
  late: { bg: "bg-[#FFD02B]/10", text: "text-[#FFD02B]" },
  paid_off: { bg: "bg-[#DDEBFF] dark:bg-[#1F6FEB]/10", text: "text-[#1F6FEB]" },
  defaulted: { bg: "bg-[#FF3638]/10", text: "text-[#FF3638]" },
  paused: { bg: "bg-[#FFD02B]/10", text: "text-[#FFD02B]" },
  in_collections: { bg: "bg-[#FF3638]/10", text: "text-[#FF3638]" },
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
