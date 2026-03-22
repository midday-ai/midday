"use client";

import {
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
} from "../chart-utils";
import { ChartTooltip } from "./chart-tooltip";

interface LineSeries {
  dataKey: string;
  dashed?: boolean;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
  yAxisId?: string;
  name?: string;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  lines: LineSeries[];
  height?: number;
  currency?: string;
  locale?: string;
  referenceLineY?: number;
  xAxisLabel?: string;
}

export function GenericLineChart({
  data,
  xAxisKey,
  lines,
  height = 320,
  currency,
  locale,
  referenceLineY,
  xAxisLabel,
}: LineChartProps) {
  const tickFormatter = createCompactTickFormatter();

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <ComposedChart
          data={data}
          margin={{ top: 6, right: 6, left: -20, bottom: xAxisLabel ? 20 : 6 }}
        >
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
            {...(xAxisLabel
              ? {
                  label: {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -10,
                    style: {
                      textAnchor: "middle" as const,
                      fill: "var(--chart-axis-text)",
                      fontSize: 10,
                      fontFamily: commonChartConfig.fontFamily,
                    },
                  },
                }
              : {})}
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
          <Tooltip
            content={<ChartTooltip currency={currency} locale={locale} />}
            wrapperStyle={{ zIndex: 9999 }}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color || "hsl(var(--primary))"}
              strokeWidth={line.strokeWidth ?? 2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={line.dot ? { fill: line.color || "hsl(var(--primary))", r: 3 } : false}
              isAnimationActive={false}
              name={line.name}
            />
          ))}
          {referenceLineY !== undefined && (
            <ReferenceLine
              y={referenceLineY}
              stroke="hsl(var(--border))"
              strokeDasharray="2 2"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
