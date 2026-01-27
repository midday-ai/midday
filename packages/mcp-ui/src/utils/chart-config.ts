/**
 * Common chart configurations and utilities
 */

import { formatCompact } from "./format";

// Common chart configurations
export const commonChartConfig = {
  margin: { top: 6, right: 20, left: 0, bottom: 6 },
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: 10,
  animationDuration: 0, // Disable animations for MCP Apps
} as const;

// Gray color palette for charts (light mode)
export const CHART_COLORS_LIGHT = [
  "hsl(0, 0%, 13%)", // Near black
  "hsl(0, 0%, 27%)", // Dark gray
  "hsl(0, 0%, 40%)", // Medium dark gray
  "hsl(0, 0%, 53%)", // Medium gray
  "hsl(0, 0%, 67%)", // Medium light gray
  "hsl(0, 0%, 80%)", // Light gray
  "hsl(0, 0%, 90%)", // Very light gray
] as const;

// Gray color palette for charts (dark mode)
export const CHART_COLORS_DARK = [
  "hsl(0, 0%, 95%)", // Near white
  "hsl(0, 0%, 80%)", // Light gray
  "hsl(0, 0%, 67%)", // Medium light gray
  "hsl(0, 0%, 53%)", // Medium gray
  "hsl(0, 0%, 40%)", // Medium dark gray
  "hsl(0, 0%, 27%)", // Dark gray
  "hsl(0, 0%, 20%)", // Very dark gray
] as const;

/**
 * Get chart colors based on current theme
 */
export function getChartColors(isDark: boolean): readonly string[] {
  return isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
}

/**
 * Check if dark mode is active (browser only)
 */
export function isDarkMode(): boolean {
  // Check if running in browser
  if (typeof window === "undefined") return false;
  return (window as Window).matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/**
 * Create Y-axis tick formatter
 */
export function createYAxisTickFormatter() {
  return (value: number): string => formatCompact(value);
}

/**
 * Returns a domain config that ensures zero is always included
 */
export function getZeroInclusiveDomain(): [
  (dataMin: number) => number,
  (dataMax: number) => number,
] {
  return [
    (dataMin: number) => Math.min(0, dataMin),
    (dataMax: number) => Math.max(0, dataMax),
  ];
}

/**
 * Calculate margin based on tick text length
 */
export function calculateChartMargin<T extends Record<string, unknown>>(
  data: T[],
  dataKey: keyof T,
  tickFormatter: (value: number) => string,
): { marginLeft: number } {
  const values = data.map((d) => {
    const val = d[dataKey];
    return typeof val === "number" ? val : 0;
  });
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));

  const formattedTick = tickFormatter(maxAbsValue);
  const marginLeft = 48 - formattedTick.length * 5;

  return { marginLeft };
}

/**
 * Preferred frame sizes for different chart types
 */
export const CHART_FRAME_SIZES = {
  donut: { width: 500, height: 400 },
  bar: { width: 700, height: 450 },
  line: { width: 700, height: 400 },
  area: { width: 700, height: 400 },
  gauge: { width: 400, height: 350 },
  stackedBar: { width: 700, height: 450 },
} as const;
