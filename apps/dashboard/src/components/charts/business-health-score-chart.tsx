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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 0, right: 6, left: -marginLeft, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="healthScoreGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
