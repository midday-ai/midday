import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RevenueSummaryWidget() {
  const trpc = useTRPC();
  const { from, to, revenueType, period, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getRevenueSummary.queryOptions({
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
        title="Revenue Summary"
        icon={<Icons.TrendingUp className="size-4" />}
        descriptionLines={2}
      />
    );
  }

  const periodLabel = getPeriodLabel(period, from, to);
  const revenueTypeLabel = revenueType === "gross" ? "Gross" : "Net";

  return (
    <BaseWidget
      title="Revenue Summary"
      icon={<Icons.TrendingUp className="size-4" />}
      description={
        <div className="flex flex-col gap-1">
          <p className="text-sm text-[#666666]">
            {revenueTypeLabel} revenue · {periodLabel}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        {data?.result && (
          <h2 className="text-2xl font-normal">
            <FormatAmount
              amount={data.result.totalRevenue}
              currency={currency || "USD"}
            />
          </h2>
        )}
      </div>
    </BaseWidget>
  );
}
