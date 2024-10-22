"use client";

import { format } from "date-fns";
import React, { useMemo } from "react";
import {
    Area,
    AreaChart as BaseAreaChart,
    CartesianGrid,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
} from "recharts";
import { Payload } from "recharts/types/component/DefaultTooltipContent";
import {
    formatAmount,
    getYAxisWidth,
    roundToNearestFactor,
} from "../../../lib/chart-utils";
import { BarChartMultiDataPoint, ChartDataPoint } from "../../../types/chart";

import { generatePayloadArray } from "../../../lib/random/generator";
import { ChartTooltip, ChartTooltipContent } from "../../chart";
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
 * Custom tooltip content component for the AreaChart.
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
 * Props for the AreaChart component.
 */
export interface AreaChartProps {
    currency: string;
    data: Array<ChartDataPoint>;
    height?: number;
    locale?: string;
    enableAssistantMode?: boolean;
    disabled?: boolean;
}

/**
 * AreaChart component that displays financial data over time.
 *
 * @param props - The component props
 * @returns A React component
 */
export const AreaChart: React.FC<AreaChartProps> = ({
    currency,
    data: propData,
    height = 290,
    locale,
    enableAssistantMode,
    disabled = false,
}) => {
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

    const [aiModalOpenState, setAiModalOpenState] =
        React.useState<boolean>(false);
    const { isOpen, toggleOpen } = useWrapperState(aiModalOpenState);
    const [dataSet, setDataSet] = React.useState<
        Array<ChartDataPoint> | Array<BarChartMultiDataPoint>
    >(data.length > 0 ? data : []);

    // Add this useEffect hook to update dataSet when data changes
    React.useEffect(() => {
        setDataSet(data);
    }, [data]);

    const filterDataByDateRange = (dateRange: { from: Date; to: Date }) => {
        const { from, to } = dateRange;
        setDataSet(
            data.filter(({ date }) => new Date(date) >= from && new Date(date) <= to),
        );
    };

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
     * Custom tooltip component for the AreaChart.
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

    const [minValue, maxValue] = useMemo(() => {
        return [
            Math.min(...data.map(item => item.value)),
            Math.max(...data.map(item => item.value))
        ];
    }, [data]);

    return (
        <ChartContainer<any>
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
            <BaseAreaChart
                data={dataSet}
                className="rounded-md border"
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

                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={15}
                    domain={[minValue * 0.9, maxValue * 1.1]}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    minTickGap={32}
                    tickFormatter={getLabel}
                    width={getYAxisWidth(yAxisLabelMaxValue)}
                    tick={{
                        fill: "#606060",
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                    }}
                />
                <defs>
                    <pattern
                        id="raster"
                        patternUnits="userSpaceOnUse"
                        width="64"
                        height="64"
                    >
                        {/* Pattern paths */}
                        {[...Array(17)].map((_, i) => (
                            <path
                                key={i}
                                d={`M${-106 + i * 8} 110L${22 + i * 8} -18`}
                                stroke="#282828"
                            />
                        ))}
                    </pattern>
                </defs>

               
                <Tooltip content={CustomTooltip} cursor={false} />
                <ChartTooltip
                    content={
                        (CustomTooltip ??
                        <ChartTooltipContent
                            className="w-fit"
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />)
                    }
                />

                <Area
                    strokeWidth={2}
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="url(#raster)"
                    dot={false}
                    className="md:min-h-[400px]"
                />
            </BaseAreaChart>
        </ChartContainer>
    );
};
