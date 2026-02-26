"use client";

import {
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

interface RepaymentVelocityData {
  month: string;
  actualDays: number;
  expectedDays: number;
}

interface RepaymentVelocityChartProps {
  data: RepaymentVelocityData[];
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
    const actualDays = payload.find(
      (p: any) => p.dataKey === "actualDays",
    )?.value;
    const expectedDays = payload.find(
      (p: any) => p.dataKey === "expectedDays",
    )?.value;

    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {typeof actualDays === "number" && (
          <p className="text-black dark:text-white">
            Actual Days: {actualDays}
          </p>
        )}
        {typeof expectedDays === "number" && (
          <p className="text-black dark:text-white">
            Expected Days: {expectedDays}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function RepaymentVelocityChart({
  data,
  height = 320,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: RepaymentVelocityChartProps) {
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
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999 }}
            />
            <Line
              type="monotone"
              dataKey="actualDays"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--foreground))", r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="expectedDays"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
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
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "repayment-velocity");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="repayment-velocity"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
