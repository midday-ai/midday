"use client";

import { formatAmount } from "@/utils/format";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calculateYAxisDomain, createYAxisTickFormatter } from "./chart-utils";

interface ForecastData {
  month: string;
  actual?: number;
  forecasted?: number;
  date?: string; // Full date for tooltip
}

interface RevenueForecastChartProps {
  data: ForecastData[];
  height?: number;
  currency?: string;
  locale?: string;
  forecastStartIndex?: number;
}

// Custom tooltip component matching the reference code
const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
  locale,
  data,
  forecastStartIndex,
}: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const dataPoint = payload[0]?.payload;
    const value = payload[0]?.value;
    const isActual = payload[0]?.dataKey === "actual";
    const forecastStartMonth =
      forecastStartIndex !== undefined
        ? data?.[forecastStartIndex]?.month
        : null;
    const isForecastStartMonth =
      forecastStartMonth && dataPoint?.month === forecastStartMonth;

    // Format date for tooltip (e.g., "Nov 2025")
    const formatDate = (dateStr?: string, monthStr?: string) => {
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          }
        } catch {
          // Fall through
        }
      }
      // Fallback: use month and current year if available
      return monthStr ? `${monthStr} ${new Date().getFullYear()}` : label || "";
    };

    const displayDate = formatDate(dataPoint?.date, dataPoint?.month);

    // Format currency - use simple format like reference code
    const formatCurrency = (amount: number) => {
      const formatted = formatAmount({
        amount,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      });
      return formatted || `$${amount.toLocaleString()}`;
    };

    // Determine label text based on reference logic
    let labelText = "";
    if (isForecastStartMonth) {
      labelText = isActual ? "Actual (Baseline)" : "Forecast Start";
    } else {
      labelText = isActual ? "Actual" : "Forecast";
    }

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans-slashed-zero bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{displayDate}</p>
        <p className="text-black dark:text-white">
          Revenue: {formatCurrency(value)}
        </p>
        <p className="text-[#707070] dark:text-[#666666]">{labelText}</p>
      </div>
    );
  }
  return null;
};

export function RevenueForecastChart({
  data,
  height = 320,
  currency = "USD",
  locale,
  forecastStartIndex,
}: RevenueForecastChartProps) {
  // Calculate Y-axis domain and ticks
  const yAxisConfig = calculateYAxisDomain(data);

  // Create currency-aware tick formatter
  const formatYAxisTick = createYAxisTickFormatter(currency, locale);

  // Get forecast start month for ReferenceLine
  const forecastStartMonth =
    forecastStartIndex !== undefined &&
    forecastStartIndex > 0 &&
    forecastStartIndex <= data.length
      ? data[forecastStartIndex - 1]?.month
      : undefined;

  return (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e6e6e6"
              className="dark:stroke-[#1d1d1d]"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#707070",
                fontSize: 12,
                fontFamily: "Hedvig Letters Sans",
                className: "dark:fill-[#666666]",
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[yAxisConfig.min, yAxisConfig.max]}
              ticks={yAxisConfig.ticks}
              width={50}
              tick={{
                fill: "#707070",
                fontSize: 11,
                fontFamily: "Hedvig Letters Sans",
                className: "dark:fill-[#666666]",
              }}
              tickFormatter={formatYAxisTick}
            />
            {/* Forecast Start Reference Line - positioned at the transition point */}
            {forecastStartMonth && (
              <ReferenceLine
                x={forecastStartMonth}
                stroke="#e6e6e6"
                strokeWidth={1}
                strokeDasharray="0"
                className="dark:stroke-[#333333]"
                label={{
                  value: "Forecast Start",
                  position: "top",
                  style: {
                    fontSize: "10px",
                    fill: "#707070",
                    textAnchor: "start",
                  },
                }}
                ifOverflow="extendDomain"
              />
            )}
            <Tooltip
              content={
                <CustomTooltip
                  currency={currency}
                  locale={locale}
                  data={data}
                  forecastStartIndex={forecastStartIndex}
                />
              }
              wrapperStyle={{ zIndex: 9999 }}
              cursor={{
                stroke: "#666666",
                className: "dark:stroke-[#999999]",
              }}
              isAnimationActive={false}
            />
            {/* Actual Revenue Line (solid black/white with black/white circles) */}
            <Line
              type="linear"
              dataKey="actual"
              stroke="black"
              strokeWidth={2}
              dot={{
                fill: "black",
                strokeWidth: 0,
                r: 4,
                className: "dark:fill-white",
              }}
              activeDot={{
                r: 5,
                stroke: "black",
                strokeWidth: 2,
                fill: "black",
                className: "dark:stroke-white dark:fill-white",
              }}
              isAnimationActive={false}
              connectNulls={false}
              className="dark:stroke-white"
            />
            {/* Forecast Revenue Line (dashed white with grey circles) */}
            <Line
              type="linear"
              dataKey="forecasted"
              stroke="#666666"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{
                fill: "#666666",
                strokeWidth: 0,
                r: 4,
                className: "dark:fill-[#999999]",
              }}
              activeDot={{
                r: 5,
                stroke: "#666666",
                strokeWidth: 2,
                fill: "#666666",
                className: "dark:stroke-[#999999] dark:fill-[#999999]",
              }}
              isAnimationActive={false}
              connectNulls={false}
              className="dark:stroke-white"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
