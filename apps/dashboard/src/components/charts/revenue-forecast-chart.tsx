"use client";

import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount } from "@/utils/format";
import type { BaseChartProps } from "./chart-utils";
import {
  commonChartConfig,
  createCompactTickFormatter,
  useChartMargin,
} from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

// Breakdown of revenue sources for the bottom-up forecast
interface ForecastBreakdown {
  recurringInvoices: number;
  recurringTransactions: number;
  scheduled: number;
  collections: number;
  billableHours: number;
  newBusiness: number;
}

interface ForecastData {
  month: string;
  actual?: number | null;
  forecasted?: number | null;
  date?: string; // Full date for tooltip
  // New fields for enhanced forecast
  optimistic?: number | null;
  pessimistic?: number | null;
  confidence?: number | null;
  breakdown?: ForecastBreakdown | null;
}

interface RevenueForecastChartProps extends Omit<BaseChartProps, "data"> {
  data?: ForecastData[];
  currency?: string;
  locale?: string;
  forecastStartIndex?: number;
  enableSelection?: boolean;
  onSelectionChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onSelectionComplete?: (
    startDate: string,
    endDate: string,
    chartType: string,
  ) => void;
  onSelectionStateChange?: (isSelecting: boolean) => void;
}

// Custom tooltip component with breakdown support
const CustomTooltip = ({
  active,
  payload,
  currency = "USD",
  locale,
  forecastStartMonth,
}: {
  active?: boolean;
  payload?: any[];
  currency?: string;
  locale?: string;
  forecastStartMonth?: string | null;
}) => {
  if (active && Array.isArray(payload) && payload.length > 0) {
    // Get the data point from any payload entry (they all share the same payload)
    const data = payload[0]?.payload as ForecastData | undefined;

    // Find the actual or forecasted entry (not the confidenceRange which is an array)
    const actualEntry = payload.find((p) => p.dataKey === "actual");
    const forecastedEntry = payload.find((p) => p.dataKey === "forecasted");

    // Determine which value to show - actual takes precedence
    const isActual = actualEntry?.value != null;
    const value = isActual
      ? (actualEntry?.value as number)
      : (forecastedEntry?.value as number | undefined);

    const isForecastStart = data?.month === forecastStartMonth;

    // Extract year from date if available, otherwise use current year
    const year = data?.date
      ? format(parseISO(data.date), "yyyy")
      : new Date().getFullYear();

    // Format currency using formatAmount utility
    const formatCurrency = (amount: number) =>
      formatAmount({
        amount,
        currency,
        locale: locale ?? undefined,
        maximumFractionDigits: 0,
      }) ?? `${currency}${amount.toLocaleString()}`;

    // Check if we have breakdown data (only for forecast points)
    const hasBreakdown = !isActual && data?.breakdown;
    const breakdown = data?.breakdown;
    const confidence = data?.confidence;
    const optimistic = data?.optimistic;
    const pessimistic = data?.pessimistic;

    return (
      <div
        className="bg-white dark:bg-[#0c0c0c] border border-[#e6e6e6] dark:border-[#1d1d1d] p-2 text-[10px] font-stack-sans-slashed-zero min-w-[180px]"
        style={{
          opacity: 1,
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "0px",
        }}
      >
        <p className="mb-1 text-[#707070] dark:text-[#666666]">
          {data?.month} {year}
        </p>
        <p className="text-black dark:text-white font-medium">
          Revenue: {value != null ? formatCurrency(value) : "-"}
        </p>
        <p className="text-[#707070] dark:text-[#666666] mb-1">
          {isForecastStart
            ? isActual
              ? "Actual (Baseline)"
              : "Forecast Start"
            : isActual
              ? "Actual"
              : "Forecast"}
        </p>

        {/* Confidence band info for forecasts */}
        {!isActual && optimistic != null && pessimistic != null && (
          <div className="mt-1.5 pt-1.5 border-t border-[#e6e6e6] dark:border-[#1d1d1d]">
            <p className="text-[#707070] dark:text-[#666666] text-[9px]">
              Range: {formatCurrency(pessimistic)} -{" "}
              {formatCurrency(optimistic)}
            </p>
            {confidence != null && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                Confidence: {confidence}%
              </p>
            )}
          </div>
        )}

        {/* Breakdown of revenue sources */}
        {hasBreakdown && breakdown && (
          <div className="mt-1.5 pt-1.5 border-t border-[#e6e6e6] dark:border-[#1d1d1d]">
            <p className="text-[#888] dark:text-[#555] text-[9px] mb-0.5 uppercase tracking-wider">
              Sources
            </p>
            {breakdown.recurringInvoices > 0 && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                Recurring Invoices:{" "}
                {formatCurrency(breakdown.recurringInvoices)}
              </p>
            )}
            {breakdown.recurringTransactions > 0 && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                Recurring Deposits:{" "}
                {formatCurrency(breakdown.recurringTransactions)}
              </p>
            )}
            {breakdown.scheduled > 0 && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                Scheduled: {formatCurrency(breakdown.scheduled)}
              </p>
            )}
            {breakdown.collections > 0 && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                Collections: {formatCurrency(breakdown.collections)}
              </p>
            )}
            {breakdown.billableHours > 0 && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                Billable Hours: {formatCurrency(breakdown.billableHours)}
              </p>
            )}
            {breakdown.newBusiness > 0 && (
              <p className="text-[#707070] dark:text-[#666666] text-[9px]">
                New Business: {formatCurrency(breakdown.newBusiness)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function RevenueForecastChart({
  data,
  height = 320,
  className = "",
  currency = "USD",
  locale,
  forecastStartIndex,
  enableSelection = false,
  onSelectionChange,
  onSelectionComplete,
  onSelectionStateChange,
}: RevenueForecastChartProps) {
  // Normalize data - create a range array for confidence band
  const normalizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      ...d,
      // Create a range array for the Area component [pessimistic, optimistic]
      confidenceRange:
        d.optimistic != null && d.pessimistic != null
          ? [d.pessimistic, d.optimistic]
          : null,
    }));
  }, [data]);

  // Detect forecast start index dynamically
  const forecastStartIndexFinal = useMemo(() => {
    if (forecastStartIndex !== undefined && forecastStartIndex >= 0) {
      return forecastStartIndex;
    }

    // Find the last month that has both actual and forecasted (forecast start month)
    // or the first month that has forecasted but no actual
    let lastActualIndex = -1;
    for (let i = normalizedData.length - 1; i >= 0; i--) {
      if (
        normalizedData[i]?.actual !== null &&
        normalizedData[i]?.actual !== undefined
      ) {
        lastActualIndex = i;
        break;
      }
    }

    // If the last actual month also has forecasted, that's the forecast start
    if (
      lastActualIndex >= 0 &&
      normalizedData[lastActualIndex]?.forecasted !== null &&
      normalizedData[lastActualIndex]?.forecasted !== undefined
    ) {
      return lastActualIndex;
    }

    // Otherwise, find the first month with forecasted but no actual
    const startIndex = normalizedData.findIndex(
      (d) =>
        (d.actual === null || d.actual === undefined) &&
        d.forecasted !== null &&
        d.forecasted !== undefined,
    );

    return startIndex >= 0 ? startIndex : null;
  }, [normalizedData, forecastStartIndex]);

  // Get forecast start month for tooltip and ReferenceLine
  const forecastStartMonth =
    forecastStartIndexFinal !== null &&
    forecastStartIndexFinal !== undefined &&
    normalizedData[forecastStartIndexFinal]
      ? normalizedData[forecastStartIndexFinal].month
      : null;

  // Use compact tick formatter (same as other charts)
  const tickFormatter = createCompactTickFormatter();

  // Calculate margin using the utility hook
  // Use the maximum value from actual or forecasted for margin calculation
  const marginData = normalizedData.map((d) => ({
    value: Math.max(d.actual ?? 0, d.forecasted ?? 0),
  }));
  const { marginLeft } = useChartMargin(marginData, "value", tickFormatter);

  // Calculate dynamic domain based on data (including confidence bands)
  const yAxisDomain = useMemo(() => {
    const allValues = normalizedData
      .flatMap((d) => [
        d.actual ?? 0,
        d.forecasted ?? 0,
        d.optimistic ?? 0,
        d.pessimistic ?? 0,
      ])
      .filter((v) => v > 0);

    if (allValues.length === 0) return { min: 0, max: 10000 };

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    // Add 10% padding
    const padding = (max - min) * 0.1;
    const minWithPadding = Math.max(0, min - padding);
    const maxWithPadding = max + padding;

    return { min: minWithPadding, max: maxWithPadding };
  }, [normalizedData]);

  // Check if we have confidence band data
  const hasConfidenceBand = useMemo(() => {
    return normalizedData.some((d) => d.confidenceRange != null);
  }, [normalizedData]);

  const chartContent = (
    <div className={`w-full ${className}`}>
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart
            data={normalizedData}
            margin={{ top: 20, right: 6, left: -marginLeft, bottom: 6 }}
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
              tickFormatter={tickFormatter}
              domain={[yAxisDomain.min, yAxisDomain.max]}
            />
            {forecastStartIndexFinal !== null &&
              forecastStartIndexFinal !== undefined &&
              forecastStartIndexFinal >= 0 && (
                <ReferenceLine
                  x={forecastStartIndexFinal}
                  stroke="var(--chart-reference-line-stroke)"
                  strokeWidth={1}
                  label={{
                    value: "Forecast Start",
                    position: "top",
                    fill: "var(--chart-reference-label)",
                    style: {
                      fontSize: "10px",
                      fill: "var(--chart-reference-label)",
                      textAnchor: "start",
                    },
                  }}
                />
              )}
            {/* Confidence band (shaded area between pessimistic and optimistic) */}
            {hasConfidenceBand && (
              <Area
                type="monotone"
                dataKey="confidenceRange"
                fill="var(--chart-forecast-line)"
                fillOpacity={0.1}
                stroke="none"
                isAnimationActive={false}
                connectNulls={false}
              />
            )}
            <Tooltip
              content={
                <CustomTooltip
                  currency={currency}
                  locale={locale}
                  forecastStartMonth={forecastStartMonth}
                />
              }
              wrapperStyle={{ zIndex: 9999 }}
              contentStyle={{
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "0px",
                zIndex: 9999,
              }}
              cursor={{
                stroke: "var(--chart-tooltip-cursor)",
                strokeWidth: 1,
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--chart-actual-line)"
              strokeWidth={2}
              dot={{
                fill: "var(--chart-actual-line)",
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                r: 5,
                stroke: "var(--chart-actual-line)",
                strokeWidth: 2,
                fill: "var(--chart-actual-line)",
              }}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecasted"
              stroke="var(--chart-forecast-line)"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{
                fill: "var(--chart-forecast-line)",
                strokeWidth: 0,
                r: 4,
              }}
              activeDot={{
                r: 5,
                stroke: "var(--chart-forecast-line)",
                strokeWidth: 2,
                fill: "var(--chart-forecast-line)",
              }}
              isAnimationActive={false}
              connectNulls={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <SelectableChartWrapper
      data={normalizedData}
      dateKey="month"
      enableSelection={enableSelection}
      onSelectionChange={onSelectionChange}
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "revenue-forecast");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="revenue-forecast"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
