"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCompact, formatMonthYear } from "@/utils/format";
import { commonChartConfig, calculateChartMargin, isDarkMode } from "@/utils/chart-config";
import { InlineLegend } from "@/components/base";

export interface ForecastHistoricalItem {
  date: string;
  value: number;
  currency: string;
}

export interface ForecastItem {
  date: string;
  value: number;
  currency: string;
  optimistic?: number;
  pessimistic?: number;
  confidence?: number;
}

export interface ForecastSummary {
  nextMonthProjection: number;
  avgMonthlyGrowthRate: number;
  totalProjectedRevenue: number;
  currency: string;
  peakMonth?: {
    date: string;
    value: number;
  };
}

export interface ForecastChartProps {
  historical: ForecastHistoricalItem[];
  forecast: ForecastItem[];
  summary?: ForecastSummary;
  currency?: string;
  height?: number;
  className?: string;
}

/**
 * Revenue forecast chart with historical data and projections
 */
export function ForecastChart({
  historical,
  forecast,
  summary,
  currency,
  height = 320,
  className = "",
}: ForecastChartProps) {
  const isDark = isDarkMode();
  const effectiveCurrency = currency || summary?.currency || "USD";

  // Combine historical and forecast data
  const allLabels = [
    ...historical.map((h) => formatMonthYear(h.date)),
    ...forecast.map((f) => formatMonthYear(f.date)),
  ];

  const chartData = allLabels.map((label, index) => {
    const isHistorical = index < historical.length;
    const histItem = isHistorical ? historical[index] : null;
    const forecastIndex = index - historical.length;
    const forecastItem = !isHistorical ? forecast[forecastIndex] : null;

    // Connect the last historical point to the first forecast point
    const connectPoint = index === historical.length - 1 && forecast.length > 0;

    return {
      month: label,
      historical: histItem?.value ?? null,
      forecast: forecastItem?.value ?? (connectPoint ? historical[historical.length - 1]?.value : null),
      optimistic: forecastItem?.optimistic ?? (connectPoint ? historical[historical.length - 1]?.value : null),
      pessimistic: forecastItem?.pessimistic ?? (connectPoint ? historical[historical.length - 1]?.value : null),
    };
  });

  const tickFormatter = (value: number) => formatCompact(value);
  const maxValues = chartData.map((d) => ({
    maxValue: Math.max(
      d.historical ?? 0,
      d.forecast ?? 0,
      d.optimistic ?? 0,
    ),
  }));
  const { marginLeft } = calculateChartMargin(maxValues, "maxValue", tickFormatter);

  const forecastColor = isDark ? "#4ade80" : "#22c55e";
  const confidenceColor = isDark ? "rgba(74, 222, 128, 0.15)" : "rgba(34, 197, 94, 0.15)";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const hist = payload.find((p: any) => p.dataKey === "historical")?.value;
      const fore = payload.find((p: any) => p.dataKey === "forecast")?.value;

      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          {typeof hist === "number" && hist !== null && (
            <p className="chart-tooltip-value">
              Historical: {formatCurrency(hist, effectiveCurrency)}
            </p>
          )}
          {typeof fore === "number" && fore !== null && (
            <p className="chart-tooltip-value">
              Forecast: {formatCurrency(fore, effectiveCurrency)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 border border-border rounded">
            <div className="text-[11px] text-muted-foreground mb-1">
              Next Month Projection
            </div>
            <div className="text-base font-semibold text-foreground">
              {formatCurrency(summary.nextMonthProjection, effectiveCurrency)}
            </div>
          </div>
          <div className="p-3 border border-border rounded">
            <div className="text-[11px] text-muted-foreground mb-1">
              Total Projected Revenue
            </div>
            <div className="text-base font-semibold text-foreground">
              {formatCurrency(summary.totalProjectedRevenue, effectiveCurrency)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {forecast.length} months forecast
            </div>
          </div>
          <div className="p-3 border border-border rounded">
            <div className="text-[11px] text-muted-foreground mb-1">
              Growth Rate
            </div>
            <div className="text-base font-semibold text-foreground">
              {summary.avgMonthlyGrowthRate >= 0 ? "+" : ""}
              {summary.avgMonthlyGrowthRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground">monthly average</div>
          </div>
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 6, right: 6, left: -marginLeft, bottom: 6 }}
          >
            <defs>
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-actual-line)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--chart-actual-line)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />

            {/* Confidence range */}
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke="transparent"
              fill={confidenceColor}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="pessimistic"
              stroke="transparent"
              fill="transparent"
              isAnimationActive={false}
            />

            {/* Historical line */}
            <Area
              type="monotone"
              dataKey="historical"
              stroke="var(--chart-actual-line)"
              strokeWidth={2}
              fill="url(#historicalGradient)"
              dot={{
                fill: "var(--chart-actual-line)",
                strokeWidth: 0,
                r: 3,
              }}
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={forecastColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{
                fill: forecastColor,
                strokeWidth: 0,
                r: 3,
              }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend
        items={[
          { label: "Historical", type: "solid" },
          { label: "Forecast", type: "dashed", color: forecastColor },
          { label: "Confidence Range", type: "solid", color: confidenceColor },
        ]}
      />
    </div>
  );
}
