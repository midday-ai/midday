"use client";

import { format } from "date-fns";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart as BaseBarChartMulti,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { Payload } from "recharts/types/component/DefaultTooltipContent";
import { formatAmount } from "../../../lib/chart-utils";
import { BarChartMultiDataPoint, ChartDataPoint } from "../../../types/chart";

import { generatePayloadArray } from "../../../lib/random/generator";
import { ChartContainer } from "./chart-container";
import { useWrapperState } from "./chart-wrapper";

/**
 * Props for the ToolTipContent component.
 */
interface ToolTipContentProps {
  payload?: Array<Payload<number, string>>;
  currency: string;
  locale?: string;
}

/**
 * Custom tooltip content component for the BarChartMulti.
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
 * Props for the BarChartMulti component.
 */
export interface BarChartMultiProps {
  currency: string;
  data: Array<BarChartMultiDataPoint>;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  disabled?: boolean;
  chartType?: "stack" | "group";
}

/**
 * BarChartMulti component that displays financial data over time.
 *
 * @param props - The component props
 * @returns A React component
 */
export const BarChartMulti: React.FC<BarChartMultiProps> = ({
  currency,
  data: propData,
  height = 290,
  locale,
  enableAssistantMode,
  disabled = false,
  chartType = "stack",
}) => {
  const data = useMemo(() => {
    if (disabled) {
      return generatePayloadArray({
        count: 50,
        minValue: 100,
        maxValue: 500,
      }).map((value, index) => {
        const dataPoint: BarChartMultiDataPoint = {
          date: value.date,
          current: value.value,
          previous: index * 100,
        };
        return dataPoint;
      });
    }
    return propData;
  }, [disabled, propData]);

  const [aiModalOpenState, setAiModalOpenState] =
    React.useState<boolean>(false);
  const { isOpen, toggleOpen } = useWrapperState(aiModalOpenState);
  const [dataSet, setDataSet] = React.useState<
    Array<ChartDataPoint> | Array<BarChartMultiDataPoint>
  >(data.length > 0 ? data : []);
  const [comparisonTimePeriod, setComparisonTimePeriod] = React.useState<
    "monthly" | "weekly"
  >("weekly");

  // get all the keys in data
  const keys = React.useMemo(() => {
    return Object.keys(data[0] || {}).filter((key) => key !== "date");
  }, [data]);

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

  /**
   * Custom tooltip component for the BarChartMulti.
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

  const currentChartType = chartType === "stack" ? { stackId: "a" } : null;

  return (
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
      <BaseBarChartMulti
        data={dataSet}
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
          className="stoke-[#DCDAD2] dark:stroke-[#2C2C2C]"
        />

        <Tooltip />

        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={15}
          // tickFormatter={(value) => format(new Date(value), "MMM")}
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
          tick={{
            fill: "#606060",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
          }}
        />

        {keys.map((key, index) => (
          <Bar
            key={`${key}-${index}`}
            barSize={16}
            type="monotone"
            dataKey={key}
            stroke="hsl(var(--secondary))"
            fill={`fill-[#12121${index + 1}]`}
            {...currentChartType}
            name={key}
          />
        ))}
      </BaseBarChartMulti>
    </ChartContainer>
  );
};
