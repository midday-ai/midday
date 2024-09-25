"use client";

import { useCurrentLocale, useI18n } from "@/locales/client";
import { formatAmount, formatPercentage } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { format } from "date-fns";
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

/**
 * Props for the ToolTipContent component
 */
interface ToolTipContentProps {
  payload?: Array<{
    payload: {
      date: string;
      income: number;
      growthRate: number;
      currency: string;
    };
  }>;
}

/**
 * ToolTipContent component for the IncomeGrowthRateBarChart
 * @param payload - The data for the current tooltip
 */
const ToolTipContent: React.FC<ToolTipContentProps> = ({ payload = [] }) => {
  const t = useI18n();
  const locale = useCurrentLocale();
  const current = payload[0]?.payload;

  if (!current) return null;

  return (
    <div className="w-[240px] border shadow-sm bg-background">
      <div className="border-b-[1px] px-4 py-2 flex justify-between items-center">
        <p className="text-sm">{current.date}</p>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-[8px] h-[8px] rounded-full bg-[#4CAF50] dark:bg-[#81C784]" />
            <p className="font-medium text-[13px]">
              {formatAmount({
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                currency: current.currency,
                amount: current.income,
                locale,
              })}
            </p>
          </div>
          <p className="text-xs text-[#606060] text-right">{t("income")}</p>
        </div>

        <div className="flex justify-between">
          <div className="flex items-center justify-center space-x-2">
            <Icons.TrendingUp className="w-4 h-4 text-[#606060]" />
            <p className="font-medium text-[13px]">
              {formatPercentage(current.growthRate, locale)}
            </p>
          </div>
          <p className="text-xs text-[#606060] text-right">
            {t("growth_rate")}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Props for the IncomeGrowthRateBarChart component
 */
interface IncomeGrowthRateBarChartProps {
  /** The data to be displayed in the chart */
  data: {
    result: Array<{
      date: string;
      income: number;
    }>;
    meta: {
      currency: string;
    };
  };
  /** The height of the chart (default: 290) */
  height?: number;
}

/**
 * Calculates the growth rate between two values
 * @param currentValue - The current value
 * @param previousValue - The previous value
 * @returns The growth rate as a decimal
 */
function calculateGrowthRate(
  currentValue: number,
  previousValue: number,
): number {
  if (previousValue === 0) return 0;
  return (currentValue - previousValue) / previousValue;
}

/**
 * IncomeGrowthRateBarChart component
 *
 * This component renders a bar chart showing income and its growth rate over time.
 * It uses recharts to create a composed chart with bars for income and a line for growth rate.
 *
 * @param data - The data to be displayed in the chart
 * @param height - The height of the chart (default: 290)
 */
export function IncomeGrowthRateBarChart({
  data,
  height = 290,
}: IncomeGrowthRateBarChartProps) {
  const formattedData = data.result.map((item, index, array) => {
    const previousIncome = index > 0 ? array[index - 1]?.income : item.income;
    const growthRate = calculateGrowthRate(item.income, previousIncome ?? 0);

    return {
      ...item,
      date: format(new Date(item.date), "MMM"),
      currency: data.meta.currency,
      growthRate: growthRate,
    };
  });

  return (
    <div className="relative h-full w-full">
      <div className="space-x-4 absolute right-0 -top-10 hidden md:flex">
        <div className="flex space-x-2 items-center">
          <span className="w-2 h-2 rounded-full bg-[#4CAF50] dark:bg-[#81C784]" />
          <span className="text-sm text-[#606060]">Income</span>
        </div>
        <div className="flex space-x-2 items-center">
          <Icons.TrendingUp className="w-4 h-4 text-[#606060]" />
          <span className="text-sm text-[#606060]">Growth Rate</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={formattedData} barGap={15}>
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={15}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          <YAxis
            yAxisId="left"
            stroke="#888888"
            fontSize={12}
            tickMargin={10}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#888888"
            fontSize={12}
            tickMargin={10}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
          />

          <Tooltip content={<ToolTipContent />} cursor={false} />

          <Bar
            yAxisId="left"
            barSize={16}
            dataKey="income"
            className="fill-[#4CAF50] dark:fill-[#81C784]"
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="growthRate"
            strokeWidth={2.5}
            stroke="hsl(var(--primary))"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
