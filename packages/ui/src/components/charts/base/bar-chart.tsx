"use client";

import { format } from "date-fns";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart as BaseBarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { Payload } from "recharts/types/component/DefaultTooltipContent";
import {
  computeChartDataDifferenceOverTime,
  formatAmount,
  getYAxisWidth,
  roundToNearestFactor,
} from "../../../lib/chart-utils";
import { BarChartMultiDataPoint, ChartDataPoint } from "../../../types/chart";

import { cn } from "../../../utils/cn";
import { Button } from "../../button";

import { generatePayloadArray } from "../../../lib/random/generator";
import { ChartContainer } from "./chart-container";
import ChartWrapper, { useWrapperState } from "./chart-wrapper";

/**
 * Props for the ToolTipContent component.
 */
interface ToolTipContentProps {
  payload?: Array<Payload<number, string>>;
  currency: string;
  locale?: string;
}

/**
 * Custom tooltip content component for the BarChart.
 */
const ToolTipContent: React.FC<ToolTipContentProps> = ({
  payload,
  currency,
  locale,
}) => {
  if (!payload) return null;

  const { value = 0, date } = payload[0]?.payload ?? {};

  return (
    <div className="w-[240px] border bg-background shadow-sm">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">
            {formatAmount({
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
              currency,
              amount: value,
              locale,
            })}
          </p>
          <p className="text-right text-xs text-[#606060]">
            {date && format(new Date(date), "MMM, y")}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Props for the BarChart component.
 */
export interface BarChartProps {
  currency: string;
  data: Array<ChartDataPoint>;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  enableComparison?: boolean;
  disabled?: boolean;
}

/**
 * BarChart component that displays financial data over time.
 *
 * @param props - The component props
 * @returns A React component
 */
export const BarChart: React.FC<BarChartProps> = ({
  currency,
  data: propData,
  height = 290,
  locale,
  enableAssistantMode,
  disabled = false,
}) => {
  // if disabled generate random data
  const data = useMemo(() => {
    if (disabled) {
      return generatePayloadArray({
        count: 50,
        minValue: 100,
        maxValue: 500,
      });
    }
    return propData;
  }, [disabled, propData]);

  const [enableCompare, setEnableCompare] = React.useState<boolean>(false);
  const { isOpen, toggleOpen } = useWrapperState(false);
  const [dataSet, setDataSet] = React.useState<
    Array<ChartDataPoint> | Array<BarChartMultiDataPoint>
  >(data.length > 0 ? data : []);
  const [comparisonTimePeriod, setComparisonTimePeriod] = React.useState<
    "monthly" | "weekly"
  >("weekly");

  const filterDataByDateRange = (dateRange: { from: Date; to: Date }) => {
    const { from, to } = dateRange;
    setDataSet(
      data.filter(({ date }) => new Date(date) >= from && new Date(date) <= to),
    );
  };

  // Add this useEffect hook to update dataSet when data changes
  React.useEffect(() => {
    setDataSet(data);
  }, [data]);

  /**
   * Formats a number value as a currency string.
   *
   * @param value - The numeric value to format
   * @returns A formatted currency string
   */
  const getLabel = (value: number): string => {
    return formatAmount({
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      currency,
      amount: value,
      locale,
    });
  };

  // Calculate the maximum Y-axis value
  const maxYAxisValue = roundToNearestFactor(data.map(({ value }) => value));
  const yAxisLabelMaxValue: string = getLabel(maxYAxisValue);
  const width = getYAxisWidth(yAxisLabelMaxValue);

  /**
   * Custom tooltip component for the BarChart.
   *
   * @param props - The tooltip props from recharts
   * @returns A React component
   */
  const CustomTooltip: React.FC<TooltipProps<number, string>> = (props) => (
    <ToolTipContent
      payload={props.payload}
      locale={locale}
      currency={currency}
    />
  );

  // get the earliest date in the data
  // sort the data by date in ascending order
  const sortedData = data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const earliestDate = sortedData[0]?.date
    ? new Date(sortedData[0].date)
    : undefined;
  const latestDate = sortedData[sortedData.length - 1]?.date
    ? new Date(sortedData[sortedData.length - 1]!.date)
    : undefined;

  const differenceOverTime = computeChartDataDifferenceOverTime(
    data,
    comparisonTimePeriod,
  );

  return (
    <div className="flex flex-col gap-2 h-full sm:h-[calc(100%-150px)]">
      <ChartWrapper
        buttonText="Open"
        openButtonText="Close"
        onOpen={() => setEnableCompare(true)}
        onClose={() => setEnableCompare(false)}
        className="hidden md:block"
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold">Comparison Over Time</p>
          <div className="flex flex-1 gap-2">
            <Button
              size={"sm"}
              onClick={() => setComparisonTimePeriod("weekly")}
              variant={
                comparisonTimePeriod === "weekly" ? "default" : "outline"
              }
            >
              Weekly
            </Button>
            <Button
              size={"sm"}
              onClick={() => setComparisonTimePeriod("monthly")}
              variant={
                comparisonTimePeriod === "monthly" ? "default" : "outline"
              }
            >
              Monthly
            </Button>
          </div>
        </div>
      </ChartWrapper>
      <ChartContainer
        data={data}
        dataSet={dataSet}
        setDataSet={setDataSet}
        height={height}
        earliestDate={earliestDate ?? new Date()}
        latestDate={latestDate ?? new Date()}
        filterDataByDateRange={filterDataByDateRange}
        enableAssistantMode={enableAssistantMode}
        disabled={disabled}
      >
        <BaseBarChart
          data={enableCompare ? differenceOverTime.result : dataSet}
          className="rounded-md border"
          barGap={15}
          margin={{
            top: 30,
            right: 30,
            left: 30,
            bottom: 30,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            horizontal={false}
            className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
          />

          <Tooltip content={CustomTooltip} cursor={false} />

          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={15}
            tickFormatter={(value) => format(new Date(value), "MMM")}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={getLabel}
            width={getYAxisWidth(yAxisLabelMaxValue)}
            tick={{
              fill: "#606060",
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}
          />

          {enableCompare ? (
            <>
              <Bar dataKey="previous.value" barSize={16}>
                {differenceOverTime.result.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    className={cn(
                      "fill-[#41191A]",
                      +entry.previous.value > 0 &&
                        "fill-[#C6C6C6] dark:fill-[#323232]",
                    )}
                  />
                ))}
              </Bar>

              <Bar dataKey="current.value" barSize={16}>
                {differenceOverTime.result.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    className={cn(
                      "fill-[#FF3638]",
                      +entry.current.value > 0 &&
                        "fill-[#121212] dark:fill-[#F5F5F3]",
                    )}
                  />
                ))}
              </Bar>
            </>
          ) : (
            <Bar
              barSize={16}
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
            />
          )}
        </BaseBarChart>
        {/* <ChartWrapper
                buttonText="Open"
                openButtonText="Close"
                onOpen={() => setEnableCompare(true)}
                onClose={() => setEnableCompare(false)}
                className="absolute right-40 hidden md:block"
            >
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold">
                        Comparison Over Time
                    </p>
                    <div className="flex flex-1 gap-2">
                        <Button size={"sm"} onClick={() => setComparisonTimePeriod("weekly")} variant={
                            comparisonTimePeriod === "weekly" ? "default" : "outline"
                        }>
                            Weekly
                        </Button>
                        <Button size={"sm"} onClick={() => setComparisonTimePeriod("monthly")} variant={
                            comparisonTimePeriod === "monthly" ? "default" : "outline"
                        }>
                            Monthly
                        </Button>
                    </div>
                </div>
            </ChartWrapper> */}
      </ChartContainer>
    </div>
  );
};
