"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount } from "@/utils/format";
import {
  ChartLegend,
  StyledArea,
  StyledLine,
  StyledTooltip,
} from "./base-charts";
import type { BaseChartProps } from "./chart-utils";
import {
  commonChartConfig,
  createMonthsTickFormatter,
  createYAxisTickFormatter,
  useChartMargin,
} from "./chart-utils";
import { SelectableChartWrapper } from "./selectable-chart-wrapper";

interface RunwayData {
  month: string;
  cashRemaining: number;
  burnRate: number;
  projectedCash?: number;
  runwayMonths?: number;
}

interface RunwayChartProps extends BaseChartProps {
  data: RunwayData[];
  showProjection?: boolean;
  showLegend?: boolean;
  currency?: string;
  locale?: string;
  displayMode?: "currency" | "months";
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

// Custom formatter for runway tooltip
const runwayTooltipFormatter = (
  value: any,
  name: string,
  currency = "USD",
  locale?: string,
  displayMode: "currency" | "months" = "currency",
): [string, string] => {
  if (displayMode === "months") {
    const formattedValue = `${value.toFixed(1)} months`;
    const displayName =
      name === "runwayMonths"
        ? "Runway"
        : name === "burnRate"
          ? "Burn Rate"
          : name;
    return [formattedValue, displayName];
  }

  const formattedValue =
    formatAmount({
      amount: value,
      currency,
      locale: locale ?? undefined,
      maximumFractionDigits: 0,
    }) || `${currency}${value.toLocaleString()}`;
  const displayName =
    name === "cashRemaining"
      ? "Cash Remaining"
      : name === "burnRate"
        ? "Burn Rate"
        : "Projected Cash";
  return [formattedValue, displayName];
};

export function RunwayChart({
  data,
  height = 320,
  className = "",
  showProjection = true,
  showLegend = true,
  currency = "USD",
  locale,
  displayMode = "months",
  enableSelection = false,
  onSelectionChange,
  onSelectionComplete,
  onSelectionStateChange,
}: RunwayChartProps) {
  const isMonthsMode = displayMode === "months";
  const tickFormatter = isMonthsMode
    ? createMonthsTickFormatter()
    : createYAxisTickFormatter(currency, locale);

  // Guard against empty data
  if (!data || data.length === 0) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
      >
        <div className="text-xs text-muted-foreground -mt-12">
          No runway data available
        </div>
      </div>
    );
  }

  // Calculate margin using the actual data field
  const { marginLeft } = useChartMargin(
    data,
    isMonthsMode ? "runwayMonths" : "cashRemaining",
    tickFormatter,
  );

  const chartContent = (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      {showLegend && (
        <ChartLegend
          items={[
            {
              label: isMonthsMode ? "Runway (months)" : "Cash Remaining",
              type: "solid" as const,
              color: "hsl(var(--foreground))",
            },
            ...(isMonthsMode
              ? []
              : [
                  { label: "Burn Rate", type: "pattern" as const },
                  ...(showProjection
                    ? [{ label: "Projected", type: "dashed" as const }]
                    : []),
                ]),
          ]}
        />
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <ComposedChart
            data={data}
            margin={{
              top: 6,
              right: 6,
              left: -marginLeft,
              bottom: 6,
            }}
          >
            {isMonthsMode && (
              <defs>
                <linearGradient
                  id="runwayMonthsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--foreground))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--foreground))"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
            )}
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
              domain={isMonthsMode ? [0, "dataMax"] : undefined}
            />

            <Tooltip
              content={
                <StyledTooltip
                  formatter={(value: any, name: string) =>
                    runwayTooltipFormatter(
                      value,
                      name,
                      currency,
                      locale,
                      displayMode,
                    )
                  }
                />
              }
              wrapperStyle={{ zIndex: 9999 }}
            />

            {isMonthsMode ? (
              <Area
                type="monotone"
                dataKey="runwayMonths"
                fill="url(#runwayMonthsGradient)"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--foreground))",
                  strokeWidth: 0,
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                  fill: "hsl(var(--foreground))",
                  stroke: "hsl(var(--foreground))",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            ) : (
              <>
                <StyledArea
                  dataKey="cashRemaining"
                  usePattern={false}
                  useGradient
                />
                <StyledArea dataKey="burnRate" usePattern useGradient={false} />
                {showProjection && (
                  <StyledLine dataKey="projectedCash" strokeDasharray="5 5" />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <SelectableChartWrapper
      data={data}
      dateKey="month"
      enableSelection={enableSelection}
      onSelectionChange={onSelectionChange}
      onSelectionComplete={(startDate, endDate) => {
        onSelectionComplete?.(startDate, endDate, "runway");
      }}
      onSelectionStateChange={onSelectionStateChange}
      chartType="runway"
    >
      {chartContent}
    </SelectableChartWrapper>
  );
}
