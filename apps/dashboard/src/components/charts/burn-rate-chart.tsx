"use client";

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
import { formatAmount } from "@/utils/format";
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface BurnRateData {
  month: string;
  amount: number;
  average: number;
  currentBurn: number;
  averageBurn: number;
}

interface BurnRateChartProps {
  data: BurnRateData[];
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
  onSelectionStateChange?: (isSelecting: boolean) => void;
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
    const current = payload[0]?.value;
    const average = payload[1]?.value;

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
        {typeof current === "number" && (
          <p className="text-black dark:text-white">
            Current: {formatCurrency(current)}
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

export function BurnRateChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  enableSelection = false,
  onSelectionChange,
  onSelectionComplete,
  onSelectionStateChange,
}: BurnRateChartProps) {
  // Use the compact tick formatter
  const tickFormatter = createCompactTickFormatter();

  // Calculate margin using the utility hook
  const { marginLeft } = useChartMargin(data, "amount", tickFormatter);

  const chartContent = (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <pattern
                id="burnRatePattern"
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
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--chart-gradient-start)" />
                <stop offset="100%" stopColor="var(--chart-gradient-end)" />
              </linearGradient>
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
              dataKey="amount"
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              fill="url(#burnRatePattern)"
              dot={{
                fill: "var(--chart-actual-line)",
                strokeWidth: 0,
                r: 3,
              }}
              activeDot={{
                r: 5,
                fill: "var(--chart-actual-line)",
                stroke: "var(--chart-actual-line)",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="var(--chart-axis-text)"
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
        onSelectionComplete?.(startDate, endDate, "burn-rate");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="burn-rate"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
