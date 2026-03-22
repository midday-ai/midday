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
import {
  commonChartConfig,
  createCompactTickFormatter,
} from "../chart-utils";
import { ChartTooltip } from "./chart-tooltip";

interface AreaSeries {
  dataKey: string;
  gradient?: boolean;
  pattern?: boolean;
  name?: string;
}

interface LineSeries {
  dataKey: string;
  dashed?: boolean;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
  name?: string;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  xAxisKey: string;
  areas: AreaSeries[];
  lines?: LineSeries[];
  height?: number;
  currency?: string;
  locale?: string;
}

let areaIdCounter = 0;

export function GenericAreaChart({
  data,
  xAxisKey,
  areas,
  lines,
  height = 320,
  currency,
  locale,
}: AreaChartProps) {
  const tickFormatter = createCompactTickFormatter();
  const uniqueId = `jr-area-${++areaIdCounter}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" debounce={1}>
        <ComposedChart
          data={data}
          margin={{ top: 6, right: 6, left: -20, bottom: 6 }}
        >
          <defs>
            {areas.map((area, i) => {
              const id = `${uniqueId}-${i}`;
              return [
                area.gradient && (
                  <linearGradient
                    key={`${id}-grad`}
                    id={`${id}-grad`}
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
                ),
                area.pattern && (
                  <pattern
                    key={`${id}-pat`}
                    id={`${id}-pat`}
                    x="0"
                    y="0"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      width="8"
                      height="8"
                      fill="var(--chart-pattern-bg)"
                    />
                    <path
                      d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                      stroke="var(--chart-pattern-stroke)"
                      strokeWidth="0.8"
                      opacity="0.6"
                    />
                  </pattern>
                ),
              ];
            })}
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
          {areas.map((area, i) => {
            const id = `${uniqueId}-${i}`;
            const fillValue = area.pattern
              ? `url(#${id}-pat)`
              : area.gradient
                ? `url(#${id}-grad)`
                : "hsl(var(--foreground))";

            return (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fill={fillValue}
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
                name={area.name}
              />
            );
          })}
          {lines?.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color || "var(--chart-axis-text)"}
              strokeWidth={line.strokeWidth ?? 1}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={false}
              isAnimationActive={false}
              name={line.name}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
