"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTeamQuery } from "@/hooks/use-team";
import { useI18n } from "@/locales/client";
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

export function MonthlySpendingWidget() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: team } = useTeamQuery();
  const t = useI18n();
  const { config, isConfiguring, setIsConfiguring, saveConfig } =
    useConfigurableWidget("monthly-spending");

  const { from, to } = useMemo(() => {
    const period = config?.period ?? "current_month";
    return getWidgetPeriodDates(period, team?.fiscalYearStartMonth);
  }, [config?.period, team?.fiscalYearStartMonth]);

  const { data } = useQuery({
    ...trpc.widgets.getMonthlySpending.queryOptions({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
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

  const handleSeeExpenses = () => {
    router.push("/transactions?type=expense");
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
        title="Monthly Spending"
        icon={<Icons.Transactions className="size-4" />}
        description={getDescription()}
        onClick={handleSeeExpenses}
        actions="See biggest cost"
        onConfigure={() => setIsConfiguring(true)}
      >
        {spending && spending.totalSpending > 0 && (
          <p className="text-3xl">
            <FormatAmount
              amount={spending.totalSpending}
              currency={spending.currency}
            />
          </p>
        )}
      </BaseWidget>
    </ConfigurableWidget>
  );
}
