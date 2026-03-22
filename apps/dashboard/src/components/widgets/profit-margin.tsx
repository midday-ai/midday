import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function ProfitMarginWidget() {
  const trpc = useTRPC();
  const { from, to, period, revenueType, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getProfitMargin.queryOptions({
      from,
      to,
      currency,
      revenueType,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Profit Margin"
        icon={<Icons.PieChart className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const periodLabel = getPeriodLabel(period, from, to);
  const revenueTypeLabel = revenueType === "gross" ? "Gross" : "Net";

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <BaseWidget
      title="Profit Margin"
      icon={<Icons.PieChart className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            {revenueTypeLabel} profit margin · {periodLabel}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          {formatPercentage(data?.result.profitMargin ?? 0)}
        </h2>
      </div>
    </BaseWidget>
  );
}
