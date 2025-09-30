"use client";

import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import {
  Bar,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";

export function ProfitAnalysisWidget() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();

  // Default to last 12 months
  const months = 12;

  const getDateRange = (monthsAgo: number) => {
    const to = endOfMonth(new Date());
    const from = startOfMonth(subMonths(to, monthsAgo - 1));
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  };

  const dateRange = getDateRange(months);

  const { data } = useQuery({
    ...trpc.reports.profit.queryOptions({
      from: dateRange.from,
      to: dateRange.to,
      currency: team?.baseCurrency ?? undefined,
    }),
    ...WIDGET_POLLING_CONFIG,
  });

  const handleViewAnalysis = () => {
    // TODO: Navigate to detailed profit analysis page
    console.log("View detailed profit analysis clicked");
  };

  const formatCurrency = (amount: number) => {
    return formatAmount({
      amount,
      currency: data?.summary?.currency || team?.baseCurrency || "USD",
      locale: user?.locale,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Prepare data for chart
  const chartData = (data?.result || []).slice(-months).map((item, index) => ({
    month: format(new Date(item.date), "MMM"),
    profit: item.current.value,
    fill:
      index % 2 === 0
        ? "hsl(var(--muted-foreground))"
        : "hsl(var(--foreground))",
  }));

  // Calculate average profit
  const averageProfit = chartData.length
    ? chartData.reduce((sum, item) => sum + item.profit, 0) / chartData.length
    : 0;

  // Debug: log chart data
  console.log("Profit Analysis Chart Data:", {
    chartData,
    averageProfit,
    dataLength: chartData.length,
  });

  return (
    <BaseWidget
      title="Profit Analysis"
      icon={<Icons.PieChart className="size-4" />}
      description={
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#666666]">
            Your average profit during {months} months is{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(averageProfit)}
            </span>
          </p>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="h-16 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <Bar dataKey="profit" maxBarSize={8}>
                    {chartData.map((entry) => (
                      <Cell key={entry.month} fill={entry.fill} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-2">
              No data available
            </div>
          )}
        </div>
      }
      actions="See detailed analysis"
      onClick={handleViewAnalysis}
    >
      <div />
    </BaseWidget>
  );
}
