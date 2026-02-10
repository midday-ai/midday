"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useMetricsFilter } from "@/hooks/use-metrics-filter";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatCompactAmount } from "@/utils/format";
import { getPeriodLabel } from "@/utils/metrics-date-utils";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function CategoryExpensesWidget() {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { from, to, period, currency } = useMetricsFilter();

  const { data, isLoading } = useQuery({
    ...trpc.widgets.getCategoryExpenses.queryOptions({
      from,
      to,
      limit: 3,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="Category Expenses"
        icon={<Icons.PieChart className="size-4" />}
        descriptionLines={3}
        showValue={false}
      />
    );
  }

  const categoryData = data?.result;
  const categories = categoryData?.categories || [];
  const maxAmount = categories[0]?.amount || 0;

  const hasCategories = categoryData && categories.length > 0;

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

  const handleViewCategories = () => {
    if (!hasCategories) return;

    handleToolCall({
      toolName: "getExpenses",
      toolParams: {
        from,
        to,
        currency: currency,
        showCanvas: true,
      },
      text: `Show expense breakdown by category for ${periodLabel}`,
    });
  };

  return (
    <BaseWidget
      title="Category Expenses"
      description={
        hasCategories ? (
          <div className="flex flex-col gap-2 w-full">
            {categories.map((category, index) => {
              const percentage =
                maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;

              const barColor =
                index === 0
                  ? "bg-primary"
                  : index === 1
                    ? "bg-[#A0A0A0]"
                    : "bg-[#606060]";

              return (
                <div key={category.slug} className="flex items-center gap-3">
                  <span className="text-xs text-[#878787] truncate w-[110px] shrink-0">
                    {category.name}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className={`h-full ${barColor}`} />
                    </div>
                    <span className="text-xs shrink-0 tabular-nums">
                      {formatCompactAmount(category.amount, user?.locale)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8">
            <p className="text-sm text-muted-foreground">
              No expenses tracked yet
            </p>
          </div>
        )
      }
      icon={<Icons.PieChart className="size-4" />}
      onClick={hasCategories ? handleViewCategories : undefined}
      actions={hasCategories ? "View transactions" : undefined}
    />
  );
}
