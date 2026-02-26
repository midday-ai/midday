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
import { commonChartConfig } from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface NsfDefaultTrendsData {
  month: string;
  nsfCount: number;
  defaultRate: number;
}

interface NsfDefaultTrendsChartProps {
  data: NsfDefaultTrendsData[];
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    const nsfCount = payload.find((p: any) => p.dataKey === "nsfCount")?.value;
    const defaultRate = payload.find(
      (p: any) => p.dataKey === "defaultRate",
    )?.value;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof nsfCount === "number" && (
          <p className="text-black dark:text-white">NSF Count: {nsfCount}</p>
        )}
        {typeof defaultRate === "number" && (
          <p className="text-black dark:text-white">
            Default Rate: {defaultRate.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function NsfDefaultTrendsChart({
  data,
  height = 320,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: NsfDefaultTrendsChartProps) {
  const chartContent = (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 6, right: 6, left: -20, bottom: 6 }}
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
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
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
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Bar
              yAxisId="left"
              dataKey="nsfCount"
              fill="#dc2626"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="defaultRate"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: "#f97316", r: 3 }}
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
        onSelectionComplete?.(startDate, endDate, "nsf-default-trends");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="nsf-default-trends"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
