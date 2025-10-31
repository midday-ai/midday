import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { getWidgetPeriodDates } from "@midday/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { BaseWidget } from "./base";
import { ConfigurableWidget } from "./configurable-widget";
import { useConfigurableWidget } from "./use-configurable-widget";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSettings } from "./widget-settings";

export function RevenueSummaryWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("revenue-summary");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "fiscal_year";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const { data } = useQuery({
    ...trpc.widgets.getRevenueSummary.queryOptions({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      currency: team?.baseCurrency ?? undefined,
      revenueType: config?.revenueType ?? "net",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewTrends = () => {
    // TODO: Navigate to revenue trends page or open revenue analysis
    console.log("View revenue trends clicked");
  };

  const periodLabel = t(
    `widget_period.${config?.period ?? "fiscal_year"}` as "widget_period.fiscal_ytd",
  );

  const revenueTypeLabel = config?.revenueType === "gross" ? "Gross" : "Net";

  return (
    <ConfigurableWidget
      isConfiguring={isConfiguring}
      settings={
        <WidgetSettings
          config={config}
          onSave={saveConfig}
          onCancel={() => setIsConfiguring(false)}
          showPeriod
          showRevenueType
        />
      }
    >
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
        actions="View revenue trends"
        onClick={handleViewTrends}
        onConfigure={() => setIsConfiguring(true)}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-normal">
            <FormatAmount
              amount={data?.result.totalRevenue ?? 0}
              currency={data?.result.currency!}
            />
          </h2>
        </div>
      </BaseWidget>
    </ConfigurableWidget>
  );
}
