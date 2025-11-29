"use client";

import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function MonthlySpendingWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, currency } = useMetricsFilter();

  const { data } = useQuery({
    ...trpc.widgets.getMonthlySpending.queryOptions({
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const spending = data?.result;

  const getDescription = () => {
    if (!spending || spending.totalSpending === 0) {
      return "No expenses recorded this month";
    }

    if (spending.topCategory) {
      const percentage = spending.topCategory.percentage.toFixed(0);
      return `${spending.topCategory.name} makes up ${percentage}% of your spending`;
    }

    return "Track your monthly expenses";
  };

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

  const handleSeeExpenses = () => {
    handleToolCall({
      toolName: "getSpending",
      toolParams: {
        from,
        to,
        currency: currency,
        showCanvas: true,
      },
      text: `Show spending analysis for ${periodLabel}`,
    });
  };

  return (
    <BaseWidget
      title="Monthly Spending"
      icon={<Icons.Transactions className="size-4" />}
      description={getDescription()}
      onClick={handleSeeExpenses}
      actions="See biggest cost"
    >
      {spending && spending.totalSpending > 0 && (
        <p className="text-3xl">
          <FormatAmount
            amount={spending.totalSpending}
            currency={currency || "USD"}
          />
        </p>
      )}
    </BaseWidget>
  );
}
