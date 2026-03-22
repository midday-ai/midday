import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RunwayWidget() {
  const trpc = useTRPC();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getRunway.queryOptions({
      currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Cash Runway"
        icon={<Icons.Time className="size-4" />}
      />
    );
  }

  return (
    <BaseWidget
      title="Cash Runway"
      icon={<Icons.Time className="size-4" />}
      description="Based on last 6 months"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">{data?.result} months</h2>
      </div>
    </BaseWidget>
  );
}
