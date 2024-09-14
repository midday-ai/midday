"use client";

import { format } from "date-fns";
import React, { useMemo } from "react";
import {
  RadarChart as BaseRadialChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import {
  Payload
} from "recharts/types/component/DefaultTooltipContent";
import {
  formatAmount,
  getYAxisWidth,
  roundToNearestFactor,
} from "../../../lib/chart-utils";
import { RadialChartDataPoint } from "../../../types/chart";

import { useWrapperState } from "./chart-wrapper";

/**
 * Props for the ToolTipContent component.
 */
interface ToolTipContentProps {
  payload?: Array<Payload<number, string>>;
  currency: string;
  locale?: string;
}

/**
 * Custom tooltip content component for the RadialChart.
 */
const ToolTipContent: React.FC<ToolTipContentProps> = ({
  payload,
  currency,
  locale,
}) => {
  if (!payload) return null;

  const { value = 0, date } = payload[0]?.payload ?? {};

  return (
    <div className="w-[240px] border bg-background shadow-sm">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">
            {formatAmount({
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
              currency,
              amount: value,
              locale,
            })}
          </p>
          <p className="text-right text-xs text-[#606060]">
            {date && format(new Date(date), "MMM, y")}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Props for the RadialChart component.
 */
export interface RadialChartProps {
  currency: string;
  data: Array<RadialChartDataPoint>;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  disabled?: boolean;
}

/**
 * RadialChart component that displays financial data over time.
 *
 * @param props - The component props
 * @returns A React component
 */
export const RadialChart: React.FC<RadialChartProps> = ({
  currency,
  data: propData,
  height = 290,
  locale,
  enableAssistantMode,
  disabled = false,
}) => {
  const data = useMemo(() => {
    if (disabled) {
      return [
        { label: "Math", value: 120 },
        { label: "Chinese", value: 98 },
        { label: "English", value: 86 },
        { label: "Geography", value: 99 },
        { label: "Physics", value: 85 },
        { label: "History", value: 65 },
      ];
    }
    return propData;
  }, [disabled, propData]);

  const [aiModalOpenState, setAiModalOpenState] =
    React.useState<boolean>(false);
  const { isOpen, toggleOpen } = useWrapperState(aiModalOpenState);

  /**
   * Formats a number value as a currency string.
   *
   * @param value - The numeric value to format
   * @returns A formatted currency string
   */
  const getLabel = (value: number): string => {
    return formatAmount({
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      currency,
      amount: value,
      locale,
    });
  };

  // Calculate the maximum Y-axis value
  const maxYAxisValue = roundToNearestFactor(data.map(({ value }) => value));
  const yAxisLabelMaxValue: string = getLabel(maxYAxisValue);

  /**
   * Custom tooltip component for the RadialChart.
   *
   * @param props - The tooltip props from recharts
   * @returns A React component
   */
  const CustomTooltip: React.FC<TooltipProps<number, string>> = (props) => (
    <ToolTipContent
      payload={props.payload}
      locale={locale}
      currency={currency}
    />
  );

  const disabledClassName = disabled ? "opacity-15" : "";

  return (
    <ResponsiveContainer
      width="100%"
      height={height}
      className="flex flex-col gap-2"
    >
      <BaseRadialChart
        data={data}
        className={`rounded-md border ${disabledClassName}`}
        margin={{
          top: 30,
          right: 30,
          left: 30,
          bottom: 30,
        }}
      >
        <defs>
          <pattern
            id="raster"
            patternUnits="userSpaceOnUse"
            width="64"
            height="64"
          >
            {/* Pattern paths */}
            {[...Array(17)].map((_, i) => (
              <path
                key={i}
                d={`M${-106 + i * 8} 110L${22 + i * 8} -18`}
                stroke="#282828"
              />
            ))}
          </pattern>
        </defs>

        <PolarGrid
          strokeDasharray="3 3"
          className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
        />

        <Tooltip content={CustomTooltip} cursor={false} />

        <PolarAngleAxis
          dataKey="label"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />

        <PolarRadiusAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={getYAxisWidth(yAxisLabelMaxValue)}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />

        <Radar
          strokeWidth={2.5}
          fillOpacity={0.6}
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="url(#raster)"
        />
      </BaseRadialChart>
    </ResponsiveContainer>
  );
};
