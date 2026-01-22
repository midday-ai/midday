"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { commonChartConfig } from "./chart-utils";

interface BusinessHealthScoreData {
  month: string;
  healthScore: number;
}

interface BusinessHealthScoreChartProps {
  data: BusinessHealthScoreData[];
  height?: number;
  showLegend?: boolean;
  locale?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const healthScore = payload[0]?.value;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof healthScore === "number" && (
          <p className="text-black dark:text-white">
            Health Score: {healthScore.toFixed(1)}/100
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function BusinessHealthScoreChart({
  data,
  height = 320,
}: BusinessHealthScoreChartProps) {
  // Simple tick formatter for 0-100 scores
  const tickFormatter = (value: number) => `${value}`;

  const marginLeft = 34;

  return (
    <div className="w-full">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <LineChart
            data={data}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <linearGradient
                id="healthScoreGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
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
              domain={[0, 100]}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Line
              type="monotone"
              dataKey="healthScore"
              stroke="url(#healthScoreGradient)"
              strokeWidth={2}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
