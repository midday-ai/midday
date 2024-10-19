"use client";

import React, { useMemo } from "react";
import {
  ScatterChart as BaseScatterChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Payload } from "recharts/types/component/DefaultTooltipContent";
import { formatAmount } from "../../../lib/chart-utils";
import { ScatterChartDataPoint } from "../../../types/chart";

import { generateScatterChartData } from "../../../lib/random/generator";
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
 * Props for the ScatterChart component.
 */
export interface ScatterChartProps {
  currency: string;
  data: Array<ScatterChartDataPoint>;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  xUNit: string;
  yUnit: string;
  disabled?: boolean;
}

/**
 * ScatterChart component that displays financial data over time.
 *
 * @param props - The component props
 * @returns A React component
 */
export const ScatterChart: React.FC<ScatterChartProps> = ({
  currency,
  data: propData,
  height = 290,
  locale,
  enableAssistantMode,
  xUNit,
  yUnit,
  disabled = false,
}) => {
  // if disabled generate random data
  const data = useMemo(() => {
    if (disabled) {
      return generateScatterChartData({
        count: 50,
        minValue: 100,
        maxValue: 500,
      });
    }
    return propData;
  }, [disabled, propData]);

  const disabledClassName = disabled ? "opacity-15" : "";
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

  return (
    <ResponsiveContainer
      width="100%"
      height={height}
      className="flex flex-col gap-2"
    >
      <BaseScatterChart
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

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          horizontal={false}
          className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
        />

        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          cursorStyle={{
            stroke: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary))",
            borderRadius: "3px",
          }}
        />
        <XAxis
          dataKey="x"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={15}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
          unit={xUNit}
        />

        <YAxis
          type="number"
          dataKey={"y"}
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={getLabel}
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
          unit={yUnit}
        />

        <Scatter
          strokeWidth={2.5}
          type="monotone"
          data={data}
          stroke="hsl(var(--primary))"
          fill="url(#raster)"
        />
      </BaseScatterChart>
    </ResponsiveContainer>
  );
};
