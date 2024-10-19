import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/use-media-query";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Represents a single data point for the chart.
 */
interface ChartDataPoint {
  [key: string]: string | number;
}

/**
 * Props for the TemplatizedChart component.
 * @template T - The type of the data points
 */
interface TemplatizedChartProps<T extends ChartDataPoint>
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The data to be displayed in the chart */
  data?: T[];
  /** Additional CSS classes for the chart container */
  className?: string;
  /** The title of the chart */
  title: string;
  /** Optional link for "View More" */
  link?: string;
  /** The key in T that contains the data to be plotted on the y-axis */
  dataKey: keyof T;
  /** The key in T that contains the data to be plotted on the x-axis */
  xAxisKey: keyof T;
  /** The type of chart to render */
  chartType: "area" | "line" | "bar";
  /** Unique identifier for the chart's gradient */
  dataId: string;
  /** The number of data points to generate if data is not provided */
  dataPoints?: number;
  /** Optional gradient colors for the area fill */
  gradientColors?: {
    startColor: string;
    endColor: string;
  };
  /** Optional color scheme for the chart */
  colorScheme?: {
    stroke: string;
    fill: string;
  };
  /** Optional function to format tooltip content */
  tooltipFormatter?: (value: any, name: string, props: any) => [string, string];
}

/**
 * Generates random data for the chart when no data is provided.
 */
const generateRandomData = <T extends ChartDataPoint>(
  count: number,
  dataKey: keyof T,
  xAxisKey: keyof T,
): T[] => {
  return Array.from({ length: count }, (_, i) => {
    const dataPoint: Partial<T> = {};
    dataPoint[xAxisKey as keyof T] = new Date(2023, i, 1)
      .toISOString()
      .split("T")[0] as T[keyof T];
    dataPoint[dataKey as keyof T] = (Math.random() * 20 - 10) as T[keyof T];
    return dataPoint as T;
  });
};

/**
 * The TemplatizedChart component.
 */
const TemplatizedChart = <T extends ChartDataPoint>({
  data,
  className,
  title,
  link,
  dataKey,
  xAxisKey,
  chartType,
  dataId,
  gradientColors = {
    startColor: "#333",
    endColor: "#666",
  },
  colorScheme = {
    stroke: "#333",
    fill: "#666",
  },
  tooltipFormatter,
  dataPoints = 16,
  ...props
}: TemplatizedChartProps<T>): React.ReactElement => {
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const isSmallScreen = useMediaQuery("(min-width: 640px)");

  const dataset = useMemo(
    () =>
      data && data.length > 0
        ? data
        : generateRandomData<T>(dataPoints, dataKey, xAxisKey),
    [data, dataPoints, dataKey, xAxisKey],
  );

  const chartHeight = useMemo(() => {
    if (isMediumScreen) return 500;
    if (isSmallScreen) return 300;
    return 300;
  }, [isMediumScreen, isSmallScreen]);

  const tooltipContent = useCallback(
    (tooltipProps: any) => {
      const { payload, label } = tooltipProps;
      if (payload && payload.length) {
        const formattedValue = tooltipFormatter
          ? tooltipFormatter(payload[0].value, String(dataKey), tooltipProps)
          : [payload[0].value, String(dataKey)];
        return (
          <div className="bg-black bg-opacity-80 text-white p-2 rounded">
            <p>
              {String(xAxisKey)}: {label}
            </p>
            <p>
              {formattedValue[1]}: {formattedValue[0]}
            </p>
          </div>
        );
      }
      return null;
    },
    [dataKey, xAxisKey, tooltipFormatter],
  );

  const renderChart = () => {
    const commonProps = {
      data: dataset,
      margin: { top: 5, right: 20, bottom: 5, left: 0 },
    };

    const CommonElements = () => (
      <>
        <XAxis dataKey={String(xAxisKey)} />
        <YAxis />
        <Tooltip content={tooltipContent} />
        <defs>
          <linearGradient id={dataId} x1="0" y1="0" x2="0" y2="1">
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
      </>
    );

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CommonElements />
            <Area
              type="monotone"
              dataKey={String(dataKey)}
              stroke={colorScheme.stroke}
              fill={`url(#${dataId})`}
              strokeWidth={3}
            />
          </AreaChart>
        );
      case "line":
        return (
          <LineChart {...commonProps}>
            <CommonElements />
            <Line
              type="monotone"
              dataKey={String(dataKey)}
              stroke={colorScheme.stroke}
              strokeWidth={3}
            />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CommonElements />
            <Bar dataKey={String(dataKey)} fill={`url(#${dataId})`} />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg",
        className,
      )}
      {...props}
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
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderChart() ?? <div>No chart data available</div>}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export { TemplatizedChart };
