"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useTRPC } from "@/trpc/client";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function RecurringExpensesWidget() {
  const trpc = useTRPC();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getRecurringExpenses.queryOptions({
      from,
      to,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Recurring Expenses"
        icon={<Icons.Repeat className="size-4" />}
      />
    );
  }

  const recurringData = data?.result;

  const getDescription = () => {
    if (!recurringData || recurringData.summary.totalExpenses === 0) {
      return "No recurring expenses";
    }

    const { totalExpenses } = recurringData.summary;

    if (totalExpenses === 1) {
      return "1 recurring expense";
    }

    return `${totalExpenses} recurring expenses`;
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

  const handleViewRecurring = () => {
    handleToolCall({
      toolName: "getExpenses",
      toolParams: {
        from,
        to,
        currency: currency,
        showCanvas: true,
      },
      text: `Show recurring expenses for ${periodLabel}`,
    });
  };

  return (
    <BaseWidget
      title="Recurring Expenses"
      icon={<Icons.Repeat className="size-4" />}
      description={getDescription()}
      onClick={handleViewRecurring}
      actions="View all recurring"
    >
      {recurringData && recurringData.summary.totalExpenses > 0 && (
        <div className="flex items-baseline w-full">
          <span className="text-2xl font-normal">
            <FormatAmount
              amount={recurringData.summary.totalMonthlyEquivalent}
              currency={currency || "USD"}
            />
          </span>
          <span className="text-xs text-muted-foreground ml-1">/month</span>
        </div>
      )}
    </BaseWidget>
  );
}
