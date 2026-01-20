"use client";

import { useI18n } from "@/locales/client";
import { formatAmount } from "@/utils/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface MonthlyChartProps {
  data?: MonthlyData[];
  isLoading?: boolean;
  currency?: string;
  locale?: string;
  height?: number;
}

export function MonthlyChart({
  data = [],
  isLoading,
  currency = "JPY",
  locale = "ja-JP",
  height = 320,
}: MonthlyChartProps) {
  const t = useI18n();

  const formatValue = (value: number) => {
    return formatAmount({
      amount: value,
      currency,
      locale,
      maximumFractionDigits: 0,
    }) ?? `${currency}${value.toLocaleString()}`;
  };

  const formatYAxisTick = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("tax_filing.sections.monthly_breakdown")}</CardTitle>
          <CardDescription>
            {t("tax_filing.monthly_breakdown.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("tax_filing.empty.no_data")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_filing.sections.monthly_breakdown")}</CardTitle>
        <CardDescription>
          {t("tax_filing.monthly_breakdown.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--chart-bar-fill)]" />
            <span className="text-xs text-muted-foreground">
              {t("tax_filing.monthly_breakdown.revenue")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--chart-pattern-stroke)]" />
            <span className="text-xs text-muted-foreground">
              {t("tax_filing.monthly_breakdown.expenses")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-[var(--chart-actual-line)]" />
            <span className="text-xs text-muted-foreground">
              {t("tax_filing.monthly_breakdown.profit")}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 6, right: 6, left: 0, bottom: 6 }}
            >
              <defs>
                <pattern
                  id="expensePattern"
                  x="0"
                  y="0"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="8" height="8" fill="var(--chart-pattern-bg)" />
                  <path
                    d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                    stroke="var(--chart-pattern-stroke)"
                    strokeWidth="0.8"
                    opacity="0.6"
                  />
                </pattern>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid-stroke)"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--chart-axis-text)",
                  fontSize: 10,
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--chart-axis-text)",
                  fontSize: 10,
                }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2 text-[10px] font-sans border bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1d1d1d] text-black dark:text-white">
                        <p className="mb-1 text-gray-500 dark:text-[#666666]">
                          {label}
                        </p>
                        {payload.map((entry, index) => {
                          const value = typeof entry.value === "number" ? entry.value : 0;
                          const name = entry.dataKey === "revenue"
                            ? t("tax_filing.monthly_breakdown.revenue")
                            : entry.dataKey === "expenses"
                              ? t("tax_filing.monthly_breakdown.expenses")
                              : t("tax_filing.monthly_breakdown.profit");
                          return (
                            <p key={`${entry.dataKey}-${index}`}>
                              {name}: {formatValue(value)}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
                wrapperStyle={{ zIndex: 9999 }}
              />
              <Bar
                dataKey="revenue"
                fill="var(--chart-bar-fill)"
                isAnimationActive={false}
              />
              <Bar
                dataKey="expenses"
                fill="url(#expensePattern)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="var(--chart-actual-line)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
