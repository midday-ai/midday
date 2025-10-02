"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
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
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("recurring-expenses");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "current_month";
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

  const handleViewRecurring = () => {
    router.push(
      `/transactions?recurring=monthly&start=${fromStr}&end=${toStr}`,
    );
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
