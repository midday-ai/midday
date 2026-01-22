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
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";

interface InvoicePaymentData {
  month: string;
  averageDaysToPay: number;
  paymentRate: number;
}

interface InvoicePaymentChartProps {
  data: InvoicePaymentData[];
  height?: number;
  locale?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, locale }: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const averageDaysToPay = payload.find(
      (p) => p.dataKey === "averageDaysToPay",
    )?.value;
    const paymentRate = payload.find((p) => p.dataKey === "paymentRate")?.value;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof averageDaysToPay === "number" && (
          <p className="text-black dark:text-white">
            Avg Days to Pay: {averageDaysToPay.toFixed(1)} days
          </p>
        )}
        {typeof paymentRate === "number" && (
          <p className="text-black dark:text-white">
            Payment Rate: {paymentRate.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function InvoicePaymentChart({
  data,
  height = 320,
  locale,
}: InvoicePaymentChartProps) {
  // Use the compact tick formatter
  const tickFormatter = createCompactTickFormatter();

  // Calculate margin using the utility hook
  const { marginLeft } = useChartMargin(
    data,
    "averageDaysToPay",
    tickFormatter,
  );

  return (
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
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={(value) => `${value.toFixed(0)}`}
              dataKey="averageDaysToPay"
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
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              dataKey="paymentRate"
            />
            <Tooltip
              content={<CustomTooltip locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            {/* Average Days to Pay bars */}
            <Bar
              yAxisId="left"
              dataKey="averageDaysToPay"
              fill="var(--chart-bar-fill)"
              isAnimationActive={false}
            />
            {/* Payment Rate line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="paymentRate"
              stroke="var(--chart-line-secondary)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-line-secondary)", r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
