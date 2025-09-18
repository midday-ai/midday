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

// Dynamic margin calculation based on data values
export const useChartMargin = (
  data: any[],
  dataKeys: string[],
  tickFormatter: (value: number) => string,
) => {
  // Calculate the maximum value from the specified data keys
  const values = data
    .flatMap((d) => dataKeys.map((key) => d[key]))
    .filter((v) => typeof v === "number");
  const maxValue = values.length > 0 ? Math.max(...values) : 1000; // Default to 1000 if no data

  // Calculate the longest possible formatted value
  const longestText = tickFormatter(maxValue);
  const charCount = longestText.length;

  return {
    marginLeft: `calc(-1 * (${charCount}ch))`,
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
