"use client";

import { FormatAmount } from "@/components/format-amount";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
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

export function RecurringExpensesWidget() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { sendMessage } = useChatActions();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("recurring-expenses");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "trailing_12";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data } = useQuery({
    ...trpc.widgets.getRecurringExpenses.queryOptions({
      from: fromStr,
      to: toStr,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

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

  const handleViewRecurring = () => {
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
      text: `Show recurring expenses for ${periodLabel}`,
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
        title="Recurring Expenses"
        icon={<Icons.Repeat className="size-4" />}
        description={getDescription()}
        onClick={handleViewRecurring}
        actions="View all recurring"
        onConfigure={() => setIsConfiguring(true)}
      >
        {recurringData && recurringData.summary.totalExpenses > 0 && (
          <div className="flex items-baseline w-full">
            <span className="text-3xl">
              <FormatAmount
                amount={recurringData.summary.totalMonthlyEquivalent}
                currency={recurringData.summary.currency}
              />
            </span>
            <span className="text-xs text-muted-foreground ml-1">/month</span>
          </div>
        )}
      </BaseWidget>
    </ConfigurableWidget>
  );
}
