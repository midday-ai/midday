/**
 * Shared utilities for chart styling and data formatting
 */

import { formatAmount } from "@/utils/format";

// Tailwind classes for chart styling
export const chartClasses = {
  container: "w-full h-full",
  tooltip: {
    light: "bg-white border border-gray-200 rounded-none shadow-sm",
    dark: "bg-[#0c0c0c] border border-[#1d1d1d] rounded-none shadow-sm",
  },
  text: {
    light: "fill-gray-500",
    dark: "fill-gray-400",
  },
} as const;

// Common chart configurations
export const commonChartConfig = {
  margin: { top: 6, right: 20, left: 0, bottom: 6 },
  fontFamily: "var(--font-hedvig-sans)",
  fontSize: 10,
  animationDuration: 300,
} as const;

// Utility functions
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

// Compact tick formatter for charts (600k, 1.2M, etc.)
export const createCompactTickFormatter = () => {
  return (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };
};

// Currency-aware Y-axis tick formatter (e.g., "14k", "16k") - no currency symbol
export const createYAxisTickFormatter = (currency: string, locale?: string) => {
  return (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1000000) {
      return `${sign}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${(absValue / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };
};

// Formatter for runway months (e.g., "10.5mo", "8.2mo", "0.0mo")
export const createMonthsTickFormatter = () => {
  return (value: number): string => {
    // Handle edge cases
    if (!Number.isFinite(value)) return "0.0mo";
    if (value === 0) return "0.0mo";
    return `${value.toFixed(1)}mo`;
  };
};

// Calculate Y-axis domain and ticks for forecast charts
export const calculateYAxisDomain = <
  T extends { actual?: number; forecasted?: number },
>(
  data: T[],
) => {
  const allValues = data
    .flatMap((d) => [d.actual ?? 0, d.forecasted ?? 0])
    .filter((v) => v > 0);

  if (allValues.length === 0) return { min: 0, max: 10000, ticks: [] };

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  // Round to nearest 2k for nice increments
  const minRounded = Math.floor(min / 2000) * 2000;
  const maxRounded = Math.ceil(max / 2000) * 2000;

  // Generate ticks in 2k increments
  const ticks: number[] = [];
  for (let i = minRounded; i <= maxRounded; i += 2000) {
    ticks.push(i);
  }

  return {
    min: minRounded,
    max: maxRounded,
    ticks,
  };
};

// Font properties for axis labels
export const AXIS_FONT_PROPS = {
  fontSize: 10,
  className: "font-hedvig-sans",
};

// Calculate Y-axis width based on font size and character count
export function getYAxisWidth(value: string | undefined | null) {
  const charLength = AXIS_FONT_PROPS.fontSize * 0.6;

  if (!value || value.length === 0) {
    return charLength * 3;
  }

  return charLength * value.length + charLength * 2;
}

// Utility hook for calculating chart margins based on tick text length
export const useChartMargin = (
  data: any[],
  dataKey: string,
  tickFormatter: (value: number) => string,
) => {
  // Calculate both min and max values from the data
  const values = data.map((d) => d[dataKey]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // For margin calculation, use the maximum absolute value to determine tick range
  // This prevents excessive margin when range spans both negative and positive values
  const maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));

  // Generate realistic tick values that Recharts would actually use
  // Use the max absolute value to determine the longest tick (which will be at the extremes)
  const tickValues = [maxAbsValue];
  if (minValue < 0) {
    tickValues.push(-maxAbsValue);
  }

  // Format all ticks and find the longest one
  const formattedTicks = tickValues.map(tickFormatter);
  const longestTick = formattedTicks.reduce((a, b) =>
    a.length > b.length ? a : b,
  );

  // Calculate dynamic margin based on actual longest tick
  // Adjusted to match target values: 100k=28, 10k=35
  // The negative sign is already included in longestTick.length, so no extra margin needed
  const marginLeft = 48 - longestTick.length * 5;

  return {
    marginLeft,
  };
};

// Common chart props interface
export interface BaseChartProps {
  data: any[];
  height?: number;
  className?: string;
  showAnimation?: boolean;
}
