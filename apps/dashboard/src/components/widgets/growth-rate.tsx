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

export function GrowthRateWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("growth-rate");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "current_quarter";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const { data } = useQuery({
    ...trpc.widgets.getGrowthRate.queryOptions({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      currency: team?.baseCurrency ?? undefined,
      type: "revenue",
      revenueType: config?.revenueType ?? "net",
      period: "quarterly",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewAnalysis = () => {
    // TODO: Navigate to growth rate analysis page
    console.log("View growth rate analysis clicked");
  };

  const formatGrowthRate = (rate: number) => {
    const sign = rate > 0 ? "+" : "";
    return `${sign}${rate.toFixed(1)}%`;
  };

  const periodLabel = t(
    `widget_period.${config?.period ?? "current_quarter"}` as "widget_period.fiscal_ytd",
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
        title="Growth Rate"
        icon={<Icons.ShowChart className="size-4" />}
        description={
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#666666]">
              {revenueTypeLabel} revenue growth · {periodLabel}
            </p>
          </div>
        }
        actions="View growth analysis"
        onClick={handleViewAnalysis}
        onConfigure={() => setIsConfiguring(true)}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-normal">
              {formatGrowthRate(data?.result.quarterlyGrowthRate ?? 0)}
            </h2>
          </div>
        </div>
      </BaseWidget>
    </ConfigurableWidget>
  );
}
