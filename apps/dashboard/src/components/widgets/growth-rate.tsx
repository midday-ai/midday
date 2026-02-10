import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function GrowthRateWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, revenueType, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getGrowthRate.queryOptions({
      from,
      to,
      currency: currency,
      type: "revenue",
      revenueType,
      period: "quarterly",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Growth Rate"
        icon={<Icons.ShowChart className="size-4" />}
        descriptionLines={2}
      />
    );
  }

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
      toolName: "getGrowthRate",
      toolParams: {
        from,
        to,
        currency: currency,
        type: "revenue",
        revenueType,
        period: "quarterly",
        showCanvas: true,
      },
      text: `Show ${revenueTypeLabel.toLowerCase()} revenue growth rate analysis for ${periodLabel}`,
    });
  };

  const formatGrowthRate = (rate: number) => {
    const sign = rate > 0 ? "+" : "";
    return `${sign}${rate.toFixed(1)}%`;
  };

  return (
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
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-normal">
            {formatGrowthRate(data?.result.quarterlyGrowthRate ?? 0)}
          </h2>
        </div>
      </div>
    </BaseWidget>
  );
}
