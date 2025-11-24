"use client";

import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { getWidgetPeriodDates } from "@midday/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { BaseWidget } from "./base";
import { ConfigurableWidget } from "./configurable-widget";
import { useConfigurableWidget } from "./use-configurable-widget";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSettings } from "./widget-settings";

export function RevenueForecastWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("revenue-forecast");

  const forecastMonths = 6;

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "trailing_12";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  // Ensure widget and tool use identical parameters
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data } = useQuery({
    ...trpc.reports.revenueForecast.queryOptions({
      from: fromStr,
      to: toStr,
      forecastMonths,
      currency: team?.baseCurrency ?? undefined,
      revenueType: "net",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleToolCall = (params: {
    toolName: string;
    toolParams?: Record<string, any>;
    text: string;
  }) => {
    if (!chatId) return;

    setChatId(chatId);

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: params.text }],
      metadata: {
        toolCall: {
          toolName: params.toolName,
          toolParams: params.toolParams,
        },
      },
    });
  };

  const handleViewDetails = () => {
    const periodLabel = t(
      `widget_period.${config?.period ?? "trailing_12"}` as "widget_period.fiscal_ytd",
    );

    handleToolCall({
      toolName: "getForecast",
      toolParams: {
        from: fromStr,
        to: toStr,
        currency: team?.baseCurrency ?? undefined,
        revenueType: "net",
        forecastMonths,
        showCanvas: true,
      },
      text: `Show revenue forecast for ${periodLabel} with ${forecastMonths} months forecast`,
    });
  };

  // Prepare data for simple trend line chart
  // Show last 6 months of actual + all forecast months for better context
  const chartData = data?.combined
    ? [
        // Last 6 actual months
        ...data.historical.slice(-6).map((item) => ({
          month: format(new Date(item.date), "MMM"),
          value: item.value,
          type: "actual",
        })),
        // All forecast months
        ...data.forecast.map((item) => ({
          month: format(new Date(item.date), "MMM"),
          value: item.value,
          type: "forecast",
        })),
      ]
    : [];

  const nextMonthProjection = data?.summary?.nextMonthProjection ?? 0;
  const currency = data?.summary?.currency || team?.baseCurrency || "USD";

  return (
    <ConfigurableWidget
      isConfiguring={isConfiguring}
      settings={
        <WidgetSettings
          config={config}
          onSave={saveConfig}
          onCancel={() => setIsConfiguring(false)}
          showPeriod
        />
      }
    >
      <BaseWidget
        title="Forecast"
        icon={<Icons.TrendingUp className="size-4" />}
        onConfigure={() => setIsConfiguring(true)}
        description={
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#878787]">Revenue projection</p>

            {/* Simple trend line chart */}
            {chartData.length > 0 ? (
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 1, right: 0, left: 0, bottom: 1 }}
                  >
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-12 w-full flex items-center">
                <div className="text-xs text-muted-foreground">
                  No data available
                </div>
              </div>
            )}

            {data?.summary && (
              <p className="text-sm text-[#666666]">
                Next month projection{" "}
                <span className="font-medium text-foreground">
                  +
                  <FormatAmount
                    amount={nextMonthProjection}
                    currency={currency}
                  />
                </span>
              </p>
            )}
          </div>
        }
        actions="View forecast details"
        onClick={handleViewDetails}
      >
        <div />
      </BaseWidget>
    </ConfigurableWidget>
  );
}
