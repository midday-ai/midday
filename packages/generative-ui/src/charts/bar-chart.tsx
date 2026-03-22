"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  commonChartConfig,
  createCompactTickFormatter,
  getZeroInclusiveDomain,
} from "../chart-utils";
import { ChartTooltip } from "./chart-tooltip";

interface BarSeries {
  dataKey: string;
  fill?: "primary" | "secondary" | "pattern";
  yAxisId?: string;
  name?: string;
}

interface LineSeries {
  dataKey: string;
  dashed?: boolean;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
  yAxisId?: string;
  name?: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  bars: BarSeries[];
  lines?: LineSeries[];
  height?: number;
  currency?: string;
  locale?: string;
  referenceLineY?: number;
  dualYAxis?: {
    rightAxisId: string;
    tickSuffix?: string;
  };
}

const PATTERN_ID = "jr-bar-pattern";

function getBarFill(fill?: string): string {
  switch (fill) {
    case "secondary":
      return "var(--chart-bar-fill-secondary)";
    case "pattern":
      return `url(#${PATTERN_ID})`;
    default:
      return "var(--chart-bar-fill)";
  }
}

export function GenericBarChart({
  data,
  xAxisKey,
  bars,
  lines,
  height = 320,
  currency,
  locale,
  referenceLineY,
  dualYAxis,
}: BarChartProps) {
  const tickFormatter = createCompactTickFormatter();
  const hasNegative = data.some((d) =>
    bars.some((b) => (d[b.dataKey] as number) < 0),
  );

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <ComposedChart
          data={data}
          margin={{ top: 6, right: 6, left: -20, bottom: 6 }}
        >
          <defs>
            <pattern
              id={PATTERN_ID}
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <rect width="8" height="8" fill="var(--chart-pattern-bg)" />
              <path
                d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                stroke="var(--chart-pattern-stroke)"
                strokeWidth="0.8"
                opacity="0.6"
              />
            </pattern>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid-stroke)"
          />
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--chart-axis-text)",
              fontSize: 10,
              fontFamily: commonChartConfig.fontFamily,
            }}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--chart-axis-text)",
              fontSize: 10,
              fontFamily: commonChartConfig.fontFamily,
            }}
            tickFormatter={tickFormatter}
            domain={hasNegative ? getZeroInclusiveDomain() : undefined}
          />
          {dualYAxis && (
            <YAxis
              yAxisId={dualYAxis.rightAxisId}
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "var(--chart-axis-text)",
                fontSize: 10,
                fontFamily: commonChartConfig.fontFamily,
              }}
              tickFormatter={(v) =>
                `${v > 0 ? "+" : ""}${v.toFixed(0)}${dualYAxis.tickSuffix || ""}`
              }
              domain={getZeroInclusiveDomain()}
            />
          )}
          <Tooltip
            content={<ChartTooltip currency={currency} locale={locale} />}
            wrapperStyle={{ zIndex: 9999 }}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              yAxisId={bar.yAxisId || "left"}
              fill={getBarFill(bar.fill)}
              isAnimationActive={false}
              name={bar.name}
            />
          ))}
          {lines?.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              yAxisId={line.yAxisId || (dualYAxis ? dualYAxis.rightAxisId : "left")}
              stroke={line.color || "var(--chart-line-secondary)"}
              strokeWidth={line.strokeWidth ?? 2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={
                line.dot
                  ? { fill: "var(--chart-line-secondary)", r: 3 }
                  : false
              }
              isAnimationActive={false}
              name={line.name}
            />
          ))}
          {referenceLineY !== undefined && (
            <ReferenceLine
              y={referenceLineY}
              yAxisId="left"
              stroke="hsl(var(--border))"
              strokeDasharray="2 2"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
