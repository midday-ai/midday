"use client";

import type * as React from "react";
import * as RechartsPrimitive from "recharts";
import { commonChartConfig } from "./chart-utils";

// Base Chart Wrapper with common styling
export function BaseChart({
  data,
  margin = { top: 6, right: 6, left: -20, bottom: 6 },
  children,
}: {
  data: any[];
  height?: number;
  margin?: { top: number; right: number; left: number; bottom: number };
  children: React.ReactNode;
  config?: any;
}) {
  return (
    <RechartsPrimitive.ComposedChart data={data} margin={margin}>
      <RechartsPrimitive.CartesianGrid
        strokeDasharray="3 3"
        stroke="var(--chart-grid-stroke)"
      />
      {children}
    </RechartsPrimitive.ComposedChart>
  );
}

// Styled XAxis
export function StyledXAxis(props: any) {
  return (
    <RechartsPrimitive.XAxis
      axisLine={false}
      tickLine={false}
      tick={{ fill: "var(--chart-axis-text)", fontSize: 10 }}
      {...props}
    />
  );
}

// Styled YAxis
export function StyledYAxis(props: any) {
  return (
    <RechartsPrimitive.YAxis
      axisLine={false}
      tickLine={false}
      tick={{ fill: "var(--chart-axis-text)", fontSize: 10 }}
      {...props}
    />
  );
}

// Styled Area
export function StyledArea(props: any) {
  return (
    <RechartsPrimitive.Area
      type="monotone"
      strokeWidth={2}
      isAnimationActive={false}
      {...props}
    />
  );
}

// Styled Line
export function StyledLine(props: any) {
  return (
    <RechartsPrimitive.Line
      type="monotone"
      strokeWidth={2}
      dot={false}
      isAnimationActive={false}
      {...props}
    />
  );
}

// Styled Bar
export function StyledBar(props: any) {
  return <RechartsPrimitive.Bar {...props} />;
}

// Styled Tooltip
export function StyledTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}) {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-2 text-[10px] font-sans border bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1d1d1d] text-black dark:text-white"
        style={{
          borderRadius: "0px",
          fontFamily: commonChartConfig.fontFamily,
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p className="mb-1 text-gray-500 dark:text-[#666666]">{label}</p>
        {payload.map((entry, index) => {
          const value = typeof entry.value === "number" ? entry.value : 0;
          const [formattedValue, name] = formatter
            ? formatter(value, entry.dataKey)
            : [`${value.toLocaleString()}`, entry.dataKey];

          return (
            <p
              key={`${entry.dataKey}-${index}`}
              className="text-black dark:text-white"
            >
              {name}: {formattedValue}
            </p>
          );
        })}
      </div>
    );
  }

  return null;
}

// Chart Legend
export function ChartLegend({
  title,
  items,
}: {
  title?: string;
  items: {
    label: string;
    type: "solid" | "dashed" | "pattern";
    color?: string;
  }[];
}) {
  return (
    <div
      className={`flex items-center ${title ? "justify-between" : "justify-end"} mb-4`}
    >
      {title && (
        <h4 className="text-[18px] font-normal font-serif text-black dark:text-white">
          {title}
        </h4>
      )}
      <div className="flex gap-4 items-center">
        {items.map((item, index) => (
          <div
            key={`legend-${item.label}-${index}`}
            className="flex gap-2 items-center"
          >
            <div
              className="w-2 h-2"
              style={{
                background:
                  item.type === "solid"
                    ? item.color || "#000000"
                    : item.type === "pattern"
                      ? "repeating-linear-gradient(45deg, #666666, #666666 1px, transparent 1px, transparent 2px)"
                      : item.color || "#666666",
                borderRadius: "0",
              }}
            />
            <span className="text-[12px] text-gray-500 dark:text-[#666666]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
