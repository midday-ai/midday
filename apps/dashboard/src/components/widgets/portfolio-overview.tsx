"use client";

import { FormatAmount } from "@/components/format-amount";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function PortfolioOverviewWidget() {
  const trpc = useTRPC();
  const { currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getPortfolioOverview.queryOptions({
      currency,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Portfolio Overview"
        icon={<Icons.Accounts className="size-4" />}
      />
    );
  }

  const totalDeals = data?.result?.totalDeals ?? 0;

  return (
    <BaseWidget
      title="Portfolio Overview"
      icon={<Icons.Accounts className="size-4" />}
      description={`Total funded across ${totalDeals} deals`}
      actions="View all deals"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          <FormatAmount
            currency={currency || "USD"}
            amount={data?.result?.totalFunded ?? 0}
            minimumFractionDigits={0}
            maximumFractionDigits={0}
          />
        </h2>
      </div>
    </BaseWidget>
  );
}
