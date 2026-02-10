"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
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

interface TaxTrendData {
  month: string;
  taxAmount: number;
  taxableIncome: number;
}

interface TaxTrendChartProps {
  data: TaxTrendData[];
  height?: number;
  showLegend?: boolean;
  currency?: string;
  locale?: string;
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
    const taxAmount = payload.find((p) => p.dataKey === "taxAmount")?.value;
    const taxableIncome = payload.find(
      (p) => p.dataKey === "taxableIncome",
    )?.value;

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
        {typeof taxAmount === "number" && (
          <p className="text-black dark:text-white">
            Tax: {formatCurrency(taxAmount)}
          </p>
        )}
        {typeof taxableIncome === "number" && (
          <p className="text-black dark:text-white">
            Taxable Income: {formatCurrency(taxableIncome)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function TaxTrendChart({
  data,
  height = 320,
  currency = "USD",
  locale,
}: TaxTrendChartProps) {
  // Use the compact tick formatter
  const tickFormatter = createCompactTickFormatter();

  // Calculate margin using the utility hook
  const { marginLeft } = useChartMargin(data, "taxAmount", tickFormatter);

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
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={tickFormatter}
              dataKey="taxAmount"
            />
            <Tooltip
              content={<CustomTooltip currency={currency} locale={locale} />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            {/* Tax amount bars (white in dark mode) */}
            <Bar
              dataKey="taxAmount"
              fill="var(--chart-bar-fill)"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
