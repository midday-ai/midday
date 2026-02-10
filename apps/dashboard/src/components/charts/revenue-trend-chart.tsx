"use client";

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
import { formatAmount } from "@/utils/format";
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface RevenueTrendData {
  month: string;
  revenue: number;
  lastYearRevenue: number;
  average: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  height?: number;
  showLegend?: boolean;
  currency?: string;
  locale?: string;
  enableSelection?: boolean;
  onSelectionChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onSelectionComplete?: (
    startDate: string,
    endDate: string,
    chartType: string,
  ) => void;
}

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
  locale,
}: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const thisYear = payload.find((p) => p.dataKey === "revenue")?.value;
    const lastYear = payload.find(
      (p) => p.dataKey === "lastYearRevenue",
    )?.value;
    const average = payload.find((p) => p.dataKey === "average")?.value;

    // Format amounts using proper currency formatting
    const formatCurrency = (amount: number) =>
      formatAmount({
        amount,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${amount.toLocaleString()}`;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof thisYear === "number" && (
          <p className="text-black dark:text-white">
            This Year: {formatCurrency(thisYear)}
          </p>
        )}
        {typeof lastYear === "number" && (
          <p className="text-black dark:text-white">
            Last Year: {formatCurrency(lastYear)}
          </p>
        )}
        {typeof average === "number" && (
          <p className="text-black dark:text-white">
            Average: {formatCurrency(average)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionChange,
  onSelectionComplete,
}: RevenueTrendChartProps) {
  // Use the compact tick formatter
  const tickFormatter = createCompactTickFormatter();

  // Calculate margin using the utility hook
  const { marginLeft } = useChartMargin(data, "revenue", tickFormatter);

  const chartContent = (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
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
                fontFamily: commonChartConfig.fontFamily,
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={tickFormatter}
              dataKey="revenue"
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            {/* This Year bars (white in dark mode) */}
            <Bar
              dataKey="revenue"
              fill="var(--chart-bar-fill)"
              isAnimationActive={false}
            />
            {/* Last Year bars (dark gray in dark mode with 0.3 opacity) */}
            <Bar
              dataKey="lastYearRevenue"
              fill="var(--chart-bar-fill-secondary)"
              isAnimationActive={false}
            />
            {/* Average line */}
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--chart-line-secondary)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <SelectableChartWrapper
      data={data}
      dateKey="month"
      enableSelection={enableSelection}
      onSelectionChange={onSelectionChange}
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "revenue-trend");
      }}
      chartType="revenue-trend"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
