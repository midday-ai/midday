"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../chart";

export interface InteractiveBardChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface InteractiveBarChartProps {
  data: InteractiveBardChartDataPoint[];
  config: ChartConfig;
  title: string;
  description: string;
  height?: number;
  dateFormatter?: (date: string) => string;
}

export function InteractiveBarChart({
  data,
  config,
  title,
  description,
  height = 250,
  dateFormatter = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  },
}: InteractiveBarChartProps) {
  const chartKeys = Object.keys(config).filter((key) => key !== "views");
  const [activeChart, setActiveChart] = React.useState<string>(
    chartKeys[0] as any,
  );

  const total = React.useMemo(
    () =>
      chartKeys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: data.reduce((sum, curr) => sum + (curr[key] as number), 0),
        }),
        {} as Record<string, number>,
      ),
    [data, chartKeys],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {chartKeys.map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-xs text-muted-foreground">
                {config[key]?.label || ""}
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {total[key]?.toLocaleString() || "0"}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: `${height}px` }}
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={dateFormatter}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
