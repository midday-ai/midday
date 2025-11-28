import { useAnalyticsFilter } from "@/hooks/use-analytics-filter";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function ProfitMarginWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, revenueType, isReady } = useAnalyticsFilter();

  const { data } = useQuery({
    ...trpc.widgets.getProfitMargin.queryOptions({
      from,
      to,
      currency: team?.baseCurrency ?? undefined,
      revenueType,
    }),
    ...WIDGET_POLLING_CONFIG,
    enabled: isReady,
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

  const periodLabel = getPeriodLabel(period, from, to);
  const revenueTypeLabel = revenueType === "gross" ? "Gross" : "Net";

  const handleViewAnalysis = () => {
    handleToolCall({
      toolName: "getProfitAnalysis",
      toolParams: {
        from,
        to,
        currency: team?.baseCurrency ?? undefined,
        revenueType,
        showCanvas: true,
      },
      text: `Show ${revenueTypeLabel.toLowerCase()} profit margin analysis for ${periodLabel}`,
    });
  };

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
      actions="View margin analysis"
      onClick={handleViewAnalysis}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          {formatPercentage(data?.result.profitMargin ?? 0)}
        </h2>
      </div>
    </BaseWidget>
  );
}
