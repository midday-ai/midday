import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
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
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
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

  const handleViewTrends = () => {
    const periodLabel = t(
      `widget_period.${config?.period ?? "fiscal_year"}` as "widget_period.fiscal_ytd",
    );
    const revenueTypeLabel = config?.revenueType === "gross" ? "Gross" : "Net";

    handleToolCall({
      toolName: "getRevenueSummary",
      toolParams: {
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
        currency: team?.baseCurrency ?? undefined,
        revenueType: config?.revenueType ?? "net",
        showCanvas: true,
      },
      text: `Show ${revenueTypeLabel.toLowerCase()} revenue trends for ${periodLabel}`,
    });
  };

  const periodLabel = t(
    `widget_period.${config?.period ?? "fiscal_year"}` as "widget_period.fiscal_ytd",
  );

  const revenueTypeLabel =
    config?.revenueType === "gross"
      ? "Gross revenue (includes tax)"
      : "Net revenue (excludes tax)";

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
          <div className="flex items-center gap-2">
            <p className="text-sm text-[#666666]">
              {revenueTypeLabel} · {periodLabel}
            </p>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-[#666666] hover:text-foreground"
                  >
                    <Icons.Info size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="w-[280px] text-xs" side="right">
                  <div className="space-y-2">
                    <div>
                      <strong>Gross Revenue:</strong> Total income including
                      tax/VAT
                    </div>
                    <div>
                      <strong>Net Revenue:</strong> Total income excluding
                      tax/VAT portion
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
        actions="View revenue trends"
        onClick={handleViewTrends}
        onConfigure={() => setIsConfiguring(true)}
      >
        <div className="flex flex-col gap-2">
          {data?.result && (
            <h2 className="text-2xl font-normal">
              <FormatAmount
                amount={data.result.totalRevenue}
                currency={data.result.currency}
              />
            </h2>
          )}
        </div>
      </BaseWidget>
    </ConfigurableWidget>
  );
}
