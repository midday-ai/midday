"use client";

import type * as React from "react";
import { ResponsiveContainer } from "recharts";

export interface ChartContainerProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

/**
 * Base chart container with responsive sizing
 */
export function ChartContainer({
  children,
  height = 300,
  className = "",
}: ChartContainerProps) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export interface ChartWrapperProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Chart wrapper with optional title
 */
export function ChartWrapper({
  title,
  children,
  className = "",
}: ChartWrapperProps) {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold mb-4 text-foreground">{title}</h3>
      )}
      {children}
    </div>
  );
}
