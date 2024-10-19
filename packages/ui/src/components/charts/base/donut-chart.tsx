"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../chart";

export type DonutChartDataPoint = {
  [key: string]: string | number;
};

export interface DonutChartProps {
  title: string;
  description: string;
  data: Array<DonutChartDataPoint>;
  config: ChartConfig;
  dataKey: string;
  nameKey: string;
  activeIndex?: number;
  trendPercentage?: number;
  trendPeriod?: string;
  footerDescription?: string;
}

export function DonutChart({
  title,
  description,
  data,
  config,
  dataKey,
  nameKey,
  activeIndex = 0,
  trendPercentage,
  trendPeriod = "this month",
  footerDescription,
}: DonutChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {trendPercentage !== undefined && (
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending {trendPercentage >= 0 ? "up" : "down"} by{" "}
            {Math.abs(trendPercentage)}% {trendPeriod}
            {trendPercentage >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {footerDescription && (
          <div className="leading-none text-muted-foreground">
            {footerDescription}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
