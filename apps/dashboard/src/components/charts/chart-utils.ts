/**
 * Shared utilities for chart styling and data formatting
 */

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
  margin: { top: 5, right: 20, left: 0, bottom: 5 },
  fontFamily: "var(--font-hedvig-sans)",
  fontSize: 10,
  animationDuration: 300,
} as const;

// Utility functions
export const formatCurrency = (value: number): string => {
  return `$${(value / 1000).toFixed(0)}k`;
};

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
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
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
  // Calculate the maximum value from the data
  const maxValue = Math.max(...data.map((d) => d[dataKey]));

  // Generate realistic tick values that Recharts would actually use
  const tickValues = [];
  for (let i = 0; i <= 4; i++) {
    tickValues.push((maxValue / 4) * i);
  }

  // Format all ticks and find the longest one
  const formattedTicks = tickValues.map(tickFormatter);
  const longestTick = formattedTicks.reduce((a, b) =>
    a.length > b.length ? a : b,
  );

  // Calculate dynamic margin based on actual longest tick
  // Adjusted to match target values: 100k=28, 10k=35
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

// Sample data generators for development
export const generateSampleData = {
  burnRate: () => [
    { month: "Oct", amount: 4500, average: 6000 },
    { month: "Nov", amount: 5200, average: 6000 },
    { month: "Dec", amount: 5800, average: 6000 },
    { month: "Jan", amount: 6200, average: 6000 },
    { month: "Feb", amount: 6800, average: 6000 },
    { month: "Mar", amount: 7100, average: 6000 },
    { month: "Apr", amount: 7500, average: 6000 },
  ],

  revenue: () =>
    Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
      revenue: Math.floor(Math.random() * 15000) + 5000,
      target: 12000,
    })),

  profit: () =>
    Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
      profit: Math.floor(Math.random() * 8000) - 2000,
      expenses: Math.floor(Math.random() * 5000) + 3000,
    })),

  expenses: () =>
    Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
      amount: Math.floor(Math.random() * 7000) + 2000,
      category: ["Marketing", "Operations", "Salaries", "Office"][i % 4],
    })),
};
