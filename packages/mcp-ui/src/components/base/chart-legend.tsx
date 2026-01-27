"use client";

import type * as React from "react";

export interface LegendItem {
  label: string;
  type: "solid" | "dashed" | "pattern";
  color?: string;
}

export interface ChartLegendProps {
  title?: string;
  items: LegendItem[];
  className?: string;
}

/**
 * Chart legend component matching dashboard design
 */
export function ChartLegend({ title, items, className = "" }: ChartLegendProps) {
  return (
    <div
      className={`flex items-center ${title ? "justify-between" : "justify-end"} mb-4 ${className}`}
    >
      {title && (
        <h4 className="text-lg font-normal text-foreground">{title}</h4>
      )}
      <div className="flex gap-4 items-center">
        {items.map((item, index) => (
          <div key={`legend-${item.label}-${index}`} className="chart-legend-item">
            <div
              className="chart-legend-color"
              style={{
                background:
                  item.type === "solid"
                    ? item.color || "var(--chart-actual-line)"
                    : item.type === "pattern"
                      ? "repeating-linear-gradient(45deg, var(--chart-axis-text), var(--chart-axis-text) 1px, transparent 1px, transparent 2px)"
                      : item.color || "var(--chart-axis-text)",
                borderRadius: "0",
              }}
            />
            <span className="chart-legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline legend for use below charts
 */
export function InlineLegend({
  items,
  className = "",
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <div className={`flex gap-4 justify-center mt-3 ${className}`}>
      {items.map((item, index) => (
        <div key={`legend-${item.label}-${index}`} className="flex items-center gap-1.5">
          <div
            className="w-3 h-0.5 rounded-sm"
            style={{
              backgroundColor:
                item.type === "dashed"
                  ? "transparent"
                  : item.color || "var(--chart-actual-line)",
              backgroundImage:
                item.type === "dashed"
                  ? `repeating-linear-gradient(90deg, ${item.color || "var(--chart-axis-text)"} 0, ${item.color || "var(--chart-axis-text)"} 4px, transparent 4px, transparent 8px)`
                  : undefined,
            }}
          />
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
