"use client";

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

interface ForecastData {
  month: string;
  actual?: number | null;
  forecasted?: number | null;
  forecast?: number | null; // Alias for forecasted
  date?: string; // Full date for tooltip
}

interface RevenueForecastChartProps {
  data: ForecastData[];
  height?: number;
  currency?: string;
  locale?: string;
  forecastStartIndex?: number;
}

// Custom tooltip component using Tailwind dark mode classes
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const data = payload[0]?.payload;
    const value = payload[0]?.value;
    const isActual = payload[0]?.dataKey === "actual";
    const isAugust = data?.month === "Aug";

    return (
      <div
        className="bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d] p-2 text-[10px] font-stack-sans-slashed-zero text-black dark:text-white shadow-sm"
        style={{
          opacity: 1,
          borderRadius: "0px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p className="text-[#707070] dark:text-[#666666] mb-1">
          {data?.month} 2025
        </p>
        <p className="text-black dark:text-white">
          Revenue: ${value?.toLocaleString()}
        </p>
        <p className="text-[#707070] dark:text-[#666666]">
          {isAugust
            ? isActual
              ? "Actual (Baseline)"
              : "Forecast Start"
            : isActual
              ? "Actual"
              : "Forecast"}
        </p>
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
  // Normalize data: use forecast if available, otherwise forecasted
  // Keep null values as null (don't convert to undefined)
  const normalizedData = data.map((d) => ({
    month: d.month,
    actual: d.actual ?? null,
    forecast: d.forecast ?? d.forecasted ?? null,
    date: d.date,
  }));

  return (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={normalizedData}
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
                fontSize: 12,
                fill: "#707070",
                className: "dark:fill-[#666666]",
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: "#707070",
                className: "dark:fill-[#666666]",
              }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={[14000, 26000]}
              tickCount={7}
              width={50}
              ticks={[14000, 16000, 18000, 20000, 22000, 24000, 26000]}
            />
            <ReferenceLine
              x="Aug"
              stroke="#e6e6e6"
              className="dark:stroke-[#333333]"
              strokeWidth={1}
              label={{
                value: "Forecast Start",
                position: "top",
                style: {
                  fontSize: "10px",
                  fill: "#707070",
                  textAnchor: "start",
                },
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
              contentStyle={{
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "0px",
                zIndex: 9999,
              }}
              cursor={{
                stroke: "#666666",
                strokeWidth: 1,
                className: "dark:stroke-[#999999]",
              }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="actual"
              stroke="#000000"
              className="dark:stroke-white"
              strokeWidth={2}
              dot={{
                fill: "#000000",
                strokeWidth: 0,
                r: 4,
                className: "dark:fill-white",
              }}
              activeDot={{
                r: 5,
                stroke: "#000000",
                strokeWidth: 2,
                fill: "#000000",
                className: "dark:stroke-white dark:fill-white",
              }}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="linear"
              dataKey="forecast"
              stroke="#666666"
              className="dark:stroke-[#999999]"
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
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
