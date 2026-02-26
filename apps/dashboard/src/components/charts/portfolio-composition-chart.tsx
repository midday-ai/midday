"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { commonChartConfig } from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface PortfolioCompositionData {
  month: string;
  active: number;
  late: number;
  defaulted: number;
  paidOff: number;
  paused: number;
}

interface PortfolioCompositionChartProps {
  data: PortfolioCompositionData[];
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

const AREA_COLORS = {
  active: "#0ea5e9",
  late: "#d97706",
  defaulted: "#dc2626",
  paidOff: "#16a34a",
  paused: "#9ca3af",
} as const;

const AREA_LABELS: Record<string, string> = {
  active: "Active",
  late: "Late",
  defaulted: "Defaulted",
  paidOff: "Paid Off",
  paused: "Paused",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    return (
      <div className="border p-2 text-[10px] font-hedvig-sans bg-white dark:bg-[#0c0c0c] border-[#e6e6e6] dark:border-[#1d1d1d] text-black dark:text-white shadow-sm">
        <p className="mb-1 text-[#707070] dark:text-[#666666]">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-black dark:text-white">
            {AREA_LABELS[entry.dataKey] ?? entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PortfolioCompositionChart({
  data,
  height = 320,
  enableSelection = false,
  onSelectionStateChange,
  onSelectionComplete,
}: PortfolioCompositionChartProps) {
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
            <Area
              type="monotone"
              dataKey="paused"
              stackId="1"
              fill={AREA_COLORS.paused}
              fillOpacity={0.6}
              stroke={AREA_COLORS.paused}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="paidOff"
              stackId="1"
              fill={AREA_COLORS.paidOff}
              fillOpacity={0.6}
              stroke={AREA_COLORS.paidOff}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="defaulted"
              stackId="1"
              fill={AREA_COLORS.defaulted}
              fillOpacity={0.6}
              stroke={AREA_COLORS.defaulted}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="late"
              stackId="1"
              fill={AREA_COLORS.late}
              fillOpacity={0.6}
              stroke={AREA_COLORS.late}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="active"
              stackId="1"
              fill={AREA_COLORS.active}
              fillOpacity={0.6}
              stroke={AREA_COLORS.active}
              strokeWidth={2}
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
        onSelectionComplete?.(startDate, endDate, "portfolio-composition");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="portfolio-composition"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
