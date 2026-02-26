"use client";

import { formatAmount } from "@/utils/format";
import {
  Area,
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

interface CollectionPerformanceData {
  month: string;
  collected: number;
  expected: number;
  collectionRate: number;
}

interface CollectionPerformanceChartProps {
  data: CollectionPerformanceData[];
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
    const collected = payload.find(
      (p: any) => p.dataKey === "collected",
    )?.value;
    const expected = payload.find((p: any) => p.dataKey === "expected")?.value;
    const collectionRate = payload.find(
      (p: any) => p.dataKey === "collectionRate",
    )?.value;

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
        {typeof collected === "number" && (
          <p className="text-black dark:text-white">
            Collected: {formatCurrency(collected)}
          </p>
        )}
        {typeof expected === "number" && (
          <p className="text-black dark:text-white">
            Expected: {formatCurrency(expected)}
          </p>
        )}
        {typeof collectionRate === "number" && (
          <p className="text-black dark:text-white">
            Rate: {collectionRate.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function CollectionPerformanceChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: CollectionPerformanceChartProps) {
  const tickFormatter = createCompactTickFormatter();
  const { marginLeft } = useChartMargin(data, "expected", tickFormatter);

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
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="expected"
              fill="#9ca3af"
              fillOpacity={0.15}
              stroke="#9ca3af"
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="collected"
              fill="#0ea5e9"
              fillOpacity={0.3}
              stroke="#0ea5e9"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="collectionRate"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ fill: "#16a34a", r: 3 }}
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
        onSelectionComplete?.(startDate, endDate, "collection-performance");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="collection-performance"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
