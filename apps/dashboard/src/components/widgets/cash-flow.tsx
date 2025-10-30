import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
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

export function CashFlowWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const t = useI18n();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("cash-flow");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "current_month";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const { data } = useQuery({
    ...trpc.widgets.getCashFlow.queryOptions({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      currency: team?.baseCurrency ?? undefined,
      period: "monthly",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewAnalysis = () => {
    // TODO: Navigate to cash flow analysis page
    console.log("View cash flow analysis clicked");
  };

  const formatCashFlow = (amount: number, currency: string) => {
    const sign = amount >= 0 ? "+" : "";
    const formatted = formatAmount({
      amount,
      currency,
      locale: user?.locale,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${sign}${formatted}`;
  };

  const periodLabel = t(
    `widget_period.${config?.period ?? "current_month"}` as "widget_period.fiscal_ytd",
  );

  return (
    <ConfigurableWidget
      isConfiguring={isConfiguring}
      settings={
        <WidgetSettings
          config={config}
          onSave={saveConfig}
          onCancel={() => setIsConfiguring(false)}
          showPeriod
          showRevenueType={false}
        />
      }
    >
      <BaseWidget
        title="Cash Flow"
        icon={<Icons.Accounts className="size-4" />}
        description={
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#666666]">
              Net cash position · {periodLabel}
            </p>
          </div>
        }
        actions="View cash flow analysis"
        onClick={handleViewAnalysis}
        onConfigure={() => setIsConfiguring(true)}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-normal">
            {data &&
              formatCashFlow(
                data.result.netCashFlow ?? 0,
                data.result.currency!,
              )}
          </h2>
        </div>
      </BaseWidget>
    </ConfigurableWidget>
  );
}
