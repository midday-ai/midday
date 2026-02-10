import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function CashFlowWidget() {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getCashFlow.queryOptions({
      from,
      to,
      currency: currency,
      period: "monthly",
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Cash Flow"
        icon={<Icons.Accounts className="size-4" />}
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

  const handleViewAnalysis = () => {
    handleToolCall({
      toolName: "getCashFlow",
      toolParams: {
        from,
        to,
        currency: currency,
        period: "monthly",
        showCanvas: true,
      },
      text: `Show cash flow for ${periodLabel}`,
    });
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

  return (
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
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-normal">
          {data &&
            formatCashFlow(data.result.netCashFlow ?? 0, currency || "USD")}
        </h2>
      </div>
    </BaseWidget>
  );
}
