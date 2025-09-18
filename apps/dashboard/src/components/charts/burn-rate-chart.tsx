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
import { useChartMargin } from "./chart-utils";

interface BurnRateData {
  month: string;
  amount: number;
  average: number;
}

interface BurnRateChartProps {
  data: BurnRateData[];
  height?: number;
  chartReadyToAnimate?: boolean;
  showLegend?: boolean;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const current = payload[0]?.value;
    const average = payload[1]?.value;
    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof current === "number" && (
          <p className="text-black dark:text-white">
            Current: ${current.toLocaleString()}
          </p>
        )}
        {typeof average === "number" && (
          <p className="text-black dark:text-white">
            Average: ${average.toLocaleString()}
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
  chartReadyToAnimate = false,
}: BurnRateChartProps) {
  const tickFormatter = (value: number) => `$${(value / 1000).toFixed(0)}k`;
  const { marginLeft } = useChartMargin(
    data,
    ["amount", "average"],
    tickFormatter,
  );

  return (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height, marginLeft }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 0, right: 6, left: 0, bottom: 0 }}
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
                <rect
                  width="8"
                  height="8"
                  fill="white"
                  className="dark:fill-[#0c0c0c]"
                />
                <path
                  d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                  stroke="#707070"
                  className="dark:stroke-[#666666]"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              </pattern>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor="#707070"
                  className="dark:[stop-color:#666666]"
                />
                <stop
                  offset="100%"
                  stopColor="#000000"
                  className="dark:[stop-color:#ffffff]"
                />
              </linearGradient>
            </defs>
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
                fontSize: 10,
                fontFamily: "Hedvig Letters Sans",
                className: "dark:fill-[#666666]",
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#707070",
                fontSize: 10,
                fontFamily: "Hedvig Letters Sans",
                className: "dark:fill-[#666666]",
              }}
              tickFormatter={tickFormatter}
              domain={[0, 15000]}
              ticks={[0, 3000, 6000, 9000, 12000, 15000]}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              fill="url(#burnRatePattern)"
              dot={{
                fill: "#000000",
                strokeWidth: 0,
                r: 3,
                className: "dark:fill-white",
              }}
              activeDot={{
                r: 5,
                fill: "#000000",
                stroke: "#000000",
                strokeWidth: 2,
                className: "dark:fill-white dark:stroke-white",
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#707070"
              className="dark:stroke-[#666666]"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              style={{
                opacity: chartReadyToAnimate ? 1 : 0,
                transition: "opacity 0.3s ease-out",
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
