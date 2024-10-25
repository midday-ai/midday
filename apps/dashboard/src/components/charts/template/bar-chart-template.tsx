import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeseriesDataType } from "@/types/analytics/types";
import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/use-media-query";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";

interface TimeSeriesBarChartProps<T extends TimeseriesDataType>
  extends React.HTMLAttributes<HTMLDivElement> {
  data?: Array<T>;
  className?: string;
  link?: string;
  title?: string;
  chartHeights?: {
    mediumScreen: number;
    smallScreen: number;
    default: number;
  };
  startDate?: Date;
  dataPoints?: number;
  gradientColors?: {
    startColor: string;
    endColor: string;
  };
  dataKey: string;
  valuePrefix?: string;
  valueSuffix?: string;
  tooltipLabel?: string;
}

/**
 * Generates random data for the chart when no data is provided.
 *
 * @param count - Number of data points to generate
 * @param startDate - Starting date for the generated data
 * @param isGrowthRate - Flag to determine if generating growth rate or balance data
 * @returns An array of TimeseriesDataType objects
 */
const generateRandomData = (
  count: number,
  startDate: Date,
  isGrowthRate: boolean,
): Array<TimeseriesDataType> => {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(
      startDate.getFullYear(),
      startDate.getMonth() + i,
      1,
    ).toISOString(),
    value: isGrowthRate
      ? Math.random() * 20 - 10 // Random growth rate between -10 and 10
      : Math.random() * 100000 + 50000, // Random balance between 50,000 and 150,000
  }));
};

/**
 * TimeSeriesBarChart component displays a bar chart for time series data.
 * It can adapt to different data types and display formats based on the provided props.
 */
const TimeSeriesBarChart: React.FC<
  TimeSeriesBarChartProps<TimeseriesDataType>
> = React.memo(
  ({
    data,
    className,
    link,
    title = "Time Series Bar Chart",
    chartHeights = {
      mediumScreen: 600,
      smallScreen: 300,
      default: 300,
    },
    startDate = new Date(2023, 0, 1),
    dataPoints = 16,
    gradientColors = {
      startColor: "#333",
      endColor: "#666",
    },
    dataKey,
    valuePrefix = "",
    valueSuffix = "",
    tooltipLabel = "Value",
    ...rest
  }) => {
    const isMediumScreen = useMediaQuery("(min-width: 768px)");
    const isSmallScreen = useMediaQuery("(min-width: 640px)");

    const isGrowthRate = dataKey === "growthRate";

    const dataset = useMemo(
      () =>
        data && data.length > 0
          ? data
          : generateRandomData(dataPoints, startDate, isGrowthRate),
      [data, dataPoints, startDate, isGrowthRate],
    );

    const chartHeight = useMemo(() => {
      if (isMediumScreen) return chartHeights.mediumScreen;
      if (isSmallScreen) return chartHeights.smallScreen;
      return chartHeights.default;
    }, [isMediumScreen, isSmallScreen, chartHeights]);

    const tooltipContent = useCallback(
      (props: any) => {
        const { payload, label } = props;
        if (payload && payload.length) {
          return (
            <Card className="bg-black bg-opacity-80 text-white p-2 rounded z-50 bg-background text-foreground">
              <p>Date: {new Date(label).toLocaleDateString()}</p>
              <p>
                {tooltipLabel}: {valuePrefix}
                {isGrowthRate
                  ? payload[0].value.toFixed(2)
                  : Math.abs(payload[0].value).toFixed(2)}
                {valueSuffix}
              </p>
            </Card>
          );
        }
        return null;
      },
      [isGrowthRate, valuePrefix, valueSuffix, tooltipLabel],
    );

    const isEmptyData =
      data === undefined ||
      data?.length === 0 ||
      data?.every((item) => item.value === 0);

    return (
      <Card
        className={cn(
          "backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg",
          className,
        )}
        {...rest}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {link && (
            <Link href={link}>
              <p className="text-md text-[#606060] hover:text-foreground hover:font-bold">
                View More{" "}
                <ArrowUpRightFromSquare size={16} className="inline ml-2" />
              </p>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {isEmptyData ? (
            <div
              className="text-2xl font-bold text-center text-gray-500 mt-4 flex items-center justify-center bg-background/20 rounded-2xl border"
              style={{ minHeight: chartHeight }}
            >
              No data available. Your data may still be syncing.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={dataset}>
                <Tooltip content={tooltipContent} />
                <Bar
                  dataKey="value"
                  fill={`url(#barGradient)`}
                  stroke={gradientColors.startColor}
                  strokeWidth={1}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={gradientColors.startColor}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="100%"
                      stopColor={gradientColors.endColor}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  },
);

TimeSeriesBarChart.displayName = "TimeSeriesBarChart";

export { TimeSeriesBarChart };
