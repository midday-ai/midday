"use client";

import { formatAmount } from "@/utils/format";
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
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface FundingActivityData {
  month: string;
  funded: number;
  dealCount: number;
  avgDealSize: number;
}

interface FundingActivityChartProps {
  data: FundingActivityData[];
  height?: number;
  currency?: string;
  locale?: string;
  enableSelection?: boolean;
  onSelectionStateChange?: (isSelecting: boolean) => void;
  onSelectionComplete?: (
    startDate: string,
    endDate: string,
    chartType: string,
  ) => void;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
  locale,
}: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const current = payload[0]?.payload;
    if (!current) return null;

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
        {typeof current.funded === "number" && (
          <p className="text-black dark:text-white">
            Amount Funded: {formatCurrency(current.funded)}
          </p>
        )}
        {typeof current.dealCount === "number" && (
          <p className="text-black dark:text-white">
            Deal Count: {current.dealCount}
          </p>
        )}
        {typeof current.avgDealSize === "number" && (
          <p className="text-black dark:text-white">
            Avg Deal Size: {formatCurrency(current.avgDealSize)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function FundingActivityChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: FundingActivityChartProps) {
  const tickFormatter = createCompactTickFormatter();
  const { marginLeft } = useChartMargin(data, "funded", tickFormatter);

  const chartContent = (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
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
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={tickFormatter}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Bar
              yAxisId="left"
              dataKey="funded"
              fill="hsl(var(--foreground))"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="dealCount"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: "#0ea5e9", r: 3 }}
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
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "funding-activity");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="funding-activity"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
