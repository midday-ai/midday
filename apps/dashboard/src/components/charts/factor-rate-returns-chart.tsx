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

interface FactorRateReturnsData {
  month: string;
  revenue: number;
  funded: number;
  avgFactorRate: number;
}

interface FactorRateReturnsChartProps {
  data: FactorRateReturnsData[];
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
        {typeof current.revenue === "number" && (
          <p className="text-black dark:text-white">
            Revenue: {formatCurrency(current.revenue)}
          </p>
        )}
        {typeof current.avgFactorRate === "number" && (
          <p className="text-black dark:text-white">
            Avg Factor Rate: {current.avgFactorRate.toFixed(2)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function FactorRateReturnsChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: FactorRateReturnsChartProps) {
  const tickFormatter = createCompactTickFormatter();
  const { marginLeft } = useChartMargin(data, "revenue", tickFormatter);

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
              tickFormatter={(value) => value.toFixed(2)}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="hsl(var(--foreground))"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgFactorRate"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--muted-foreground))", r: 3 }}
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
        onSelectionComplete?.(startDate, endDate, "factor-rate-returns");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="factor-rate-returns"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
