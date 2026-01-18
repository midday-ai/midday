import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function ProfitMarginWidget() {
  const t = useI18n();
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, revenueType, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getProfitMargin.queryOptions({
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
        title={t("widgets.profit_margin.title")}
        icon={<Icons.PieChart className="size-4" />}
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
      toolName: "getProfitAnalysis",
      toolParams: {
        from,
        to,
        currency,
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
      title={t("widgets.profit_margin.title")}
      icon={<Icons.PieChart className="size-4" />}
      description={t("widgets.profit_margin.description")}
      actions={t("widgets.profit_margin.action")}
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
