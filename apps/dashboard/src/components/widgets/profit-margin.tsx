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
import { BaseWidget } from "./base";
import { ConfigurableWidget } from "./configurable-widget";
import { useConfigurableWidget } from "./use-configurable-widget";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSettings } from "./widget-settings";

export function ProfitMarginWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("profit-margin");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "trailing_12";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const { data } = useQuery({
    ...trpc.widgets.getProfitMargin.queryOptions({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      currency: team?.baseCurrency ?? undefined,
      revenueType: config?.revenueType ?? "net",
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

  const handleViewAnalysis = () => {
    const periodLabel = t(
      `widget_period.${config?.period ?? "trailing_12"}` as "widget_period.fiscal_ytd",
    );
    const revenueTypeLabel = config?.revenueType === "gross" ? "Gross" : "Net";

    handleToolCall({
      toolName: "getProfitAnalysis",
      toolParams: {
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
        currency: team?.baseCurrency ?? undefined,
        revenueType: config?.revenueType ?? "net",
        showCanvas: true,
      },
      text: `Show ${revenueTypeLabel.toLowerCase()} profit margin analysis for ${periodLabel}`,
    });
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const periodLabel = t(
    `widget_period.${config?.period ?? "trailing_12"}` as "widget_period.fiscal_ytd",
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
        title="Profit Margin"
        icon={<Icons.PieChart className="size-4" />}
        description={
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#666666]">
              {revenueTypeLabel} profit margin · {periodLabel}
            </p>
          </div>
        }
        actions="View margin analysis"
        onClick={handleViewAnalysis}
        onConfigure={() => setIsConfiguring(true)}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-normal">
            {formatPercentage(data?.result.profitMargin ?? 0)}
          </h2>
        </div>
      </BaseWidget>
    </ConfigurableWidget>
  );
}
