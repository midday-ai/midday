"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { formatCompactAmount } from "@/utils/format";
import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { Icons } from "@midday/ui/icons";
import { getWidgetPeriodDates } from "@midday/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { BaseWidget } from "./base";
import { ConfigurableWidget } from "./configurable-widget";
import { useConfigurableWidget } from "./use-configurable-widget";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSettings } from "./widget-settings";

export function CategoryExpensesWidget() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: user } = useUserQuery();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("category-expenses");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "trailing_12";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data } = useQuery({
    ...trpc.widgets.getCategoryExpenses.queryOptions({
      from: fromStr,
      to: toStr,
      limit: 3,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

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

  const handleViewCategories = () => {
    if (!hasCategories) return;

    const periodLabel = t(
      `widget_period.${config?.period ?? "trailing_12"}` as "widget_period.fiscal_ytd",
    );

    handleToolCall({
      toolName: "getExpenses",
      toolParams: {
        from: fromStr,
        to: toStr,
        currency: team?.baseCurrency ?? undefined,
        showCanvas: true,
      },
      text: `Show expense breakdown by category for ${periodLabel}`,
    });
  };

  return (
    <ConfigurableWidget
      isConfiguring={isConfiguring}
      settings={
        <WidgetSettings
          config={config}
          onSave={saveConfig}
          onCancel={() => setIsConfiguring(false)}
          showPeriod
          showRevenueType={false}
        />
      }
    >
      <BaseWidget
        title="Category Expenses"
        onConfigure={() => setIsConfiguring(true)}
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
    </ConfigurableWidget>
  );
}
