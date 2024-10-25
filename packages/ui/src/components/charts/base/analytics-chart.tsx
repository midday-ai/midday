import { format, isValid, parseISO } from "date-fns";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatAmount,
  getYAxisWidth,
  roundToNearestFactor,
} from "../../../lib/chart-utils";
import { generatePayloadArray } from "../../../lib/random/generator";
import { Button } from "../../button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../card";
import {
  ChartContainer as BaseChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "../../chart";
import { ChartContainer } from "./chart-container";

import { Progress } from "@radix-ui/react-progress";
import { BiRightArrow } from "react-icons/bi";
import { BarChartMultiDataPoint, ChartDataPoint } from "../../../types/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../tabs";
import { useWrapperState } from "./chart-wrapper";
import { InteractiveBarChart } from "./interactive-bar-chart";
import { ZoomableChart } from "./zoomable-chart";

type ChartType = "line" | "bar" | "area";

interface AnalyticsChartProps<T extends BarChartMultiDataPoint> {
  chartData: T[];
  title: string;
  description: string;
  footerDescription?: string;
  dataKeys: (keyof T)[];
  colors: string[];
  trendKey: keyof T;
  yAxisFormatter?: (value: number) => string;
  chartType: ChartType;
  stacked?: boolean;
  currency: string;
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  disabled?: boolean;
  disableViewMore?: boolean;
}

const parseDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isValid(date) ? date : null;
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  const date = parseDate(dateString);
  return date ? format(date, "MMM d, yyyy") : "Invalid Date";
};

const AnalyticsChart = <T extends BarChartMultiDataPoint>({
  chartData: propData,
  title,
  description,
  footerDescription,
  dataKeys,
  colors,
  trendKey,
  yAxisFormatter,
  chartType,
  stacked = false,
  currency,
  height = 400,
  locale,
  enableAssistantMode,
  disabled = false,
  disableViewMore = false,
}: AnalyticsChartProps<T>) => {
  const [drilldownData, setDrilldownData] = useState<T | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aiModalOpenState, setAiModalOpenState] = useState<boolean>(false);
  const { isOpen, toggleOpen } = useWrapperState(aiModalOpenState);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const data = useMemo(() => {
    if (disabled) {
      return [];
    }
    return propData;
  }, [disabled, propData]);

  const [dataSet, setDataSet] = useState<T[]>(data.length > 0 ? data : []);

  useEffect(() => {
    setDataSet(data);
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    dataKeys.forEach((key, index) => {
      config[key as string] = {
        label: key as string,
        color: colors[index] || `hsl(var(--chart-${index + 1}))`,
      };
    });
    return config;
  }, [dataKeys, colors]);

  const formattedData = useMemo(
    () =>
      dataSet
        .map((item) => {
          const date = parseDate(item.date);
          return {
            ...item,
            dateTime: date ? date.getTime() : null,
          };
        })
        .filter((item) => item.dateTime !== null)
        .sort((a, b) => (a.dateTime ?? 0) - (b.dateTime ?? 0)),
    [dataSet],
  );

  const [minValue, maxValue] = useMemo(() => {
    const allValues = formattedData.flatMap((item) =>
      dataKeys.map((key) => Number(item[key])),
    );
    return [Math.min(...allValues), Math.max(...allValues)];
  }, [formattedData, dataKeys]);

  const percentageChange = useMemo(() => {
    if (formattedData.length < 2) return 0;
    const firstValue = Number(formattedData[0]?.[trendKey] ?? 0);
    const lastValue = Number(
      formattedData[formattedData.length - 1]?.[trendKey] ?? 0,
    );
    return firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
  }, [formattedData, trendKey]);

  const isTrendingUp = percentageChange > 0;

  const handleDataPointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setDrilldownData(data.activePayload[0].payload);
      setIsDialogOpen(true);
    }
  };

  const getLabel = (value: number): string => {
    return formatAmount({
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      currency,
      amount: value,
      locale,
    });
  };

  const maxYAxisValue = roundToNearestFactor(
    formattedData.map((item) =>
      Math.max(...dataKeys.map((key) => Number(item[key]))),
    ),
  );
  const yAxisLabelMaxValue: string = getLabel(maxYAxisValue);
  const yAxisWidth = getYAxisWidth(yAxisLabelMaxValue);

  const filterDataByDateRange = (dateRange: { from: Date; to: Date }) => {
    const { from, to } = dateRange;
    setDataSet(
      data.filter(({ date }) => {
        const itemDate = new Date(date);
        return itemDate >= from && itemDate <= to;
      }) as T[],
    );
  };

  const renderChart = () => {
    const commonProps = {
      data: formattedData,
      margin: { top: 20, right: 30, left: 20, bottom: 10 },
      onClick: handleDataPointClick,
    };

    const commonAxisProps = {
      stroke: "#888888",
      fontSize: 12,
      tickLine: false,
      axisLine: false,
      tick: {
        fill: "#606060",
        fontSize: 12,
        fontFamily: "var(--font-sans)",
      },
    };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              horizontal={false}
            />
            <XAxis
              {...commonAxisProps}
              dataKey="date"
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDate}
            />
            <YAxis
              {...commonAxisProps}
              domain={[minValue * 0.9, maxValue * 1.1]}
              tickFormatter={yAxisFormatter || getLabel}
              width={yAxisWidth}
              tickMargin={10}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-fit"
                  labelFormatter={formatDate}
                />
              }
            />
            {dataKeys.map((key, index) => (
              <Bar
                key={key as string}
                dataKey={key as string}
                fill={colors[index] || `hsl(var(--chart-${index + 1}))`}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              horizontal={false}
            />
            <XAxis
              {...commonAxisProps}
              dataKey="date"
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDate}
            />
            <YAxis
              {...commonAxisProps}
              domain={[minValue * 0.9, maxValue * 1.1]}
              tickFormatter={yAxisFormatter || getLabel}
              width={yAxisWidth}
              tickMargin={10}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-fit"
                  labelFormatter={formatDate}
                />
              }
            />
            {dataKeys.map((key, index) => (
              <Area
                key={key as string}
                type="monotone"
                dataKey={key as string}
                fill={colors[index] || `hsl(var(--chart-${index + 1}))`}
                stroke={colors[index] || `hsl(var(--chart-${index + 1}))`}
                fillOpacity={0.3}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              horizontal={false}
            />
            <XAxis
              {...commonAxisProps}
              dataKey="date"
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDate}
            />
            <YAxis
              {...commonAxisProps}
              domain={[minValue * 0.9, maxValue * 1.1]}
              tickFormatter={yAxisFormatter || getLabel}
              width={yAxisWidth}
              tickMargin={10}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-fit"
                  labelFormatter={formatDate}
                />
              }
            />
            {dataKeys.map((key, index) => (
              <Line
                key={key as string}
                type="monotone"
                dataKey={key as string}
                stroke={colors[index] || `hsl(var(--chart-${index + 1}))`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        );
    }
  };

  const getActivityLevel = (value: number) => {
    if (isNaN(value)) return "N/A";
    if (value > maxValue * 0.8) return "High";
    if (value > maxValue * 0.5) return "Moderate";
    return "Low";
  };

  const getRecommendations = (value: number) => {
    const activityLevel = getActivityLevel(value);
    switch (activityLevel) {
      case "High":
        return [
          "Review your high number of transactions for any unnecessary spending",
          "Consider setting up automated savings for excess funds",
          "Look into rewards programs that benefit frequent transactions",
        ];
      case "Moderate":
        return [
          "Analyze your spending patterns to identify areas for potential savings",
          "Review your budget to ensure it aligns with your current spending",
          "Consider setting financial goals based on your consistent activity",
        ];
      case "Low":
        return [
          "Review your budget to ensure all necessary expenses are accounted for",
          "Look for opportunities to increase your savings or investments",
          "Explore ways to diversify your income or increase cash flow",
        ];
      default:
        return [
          "Insufficient data to provide recommendations",
          "Consider reviewing your data input for accuracy",
          "Ensure all necessary financial information is being tracked",
        ];
    }
  };

  // get the earliest and latest dates in the data
  const sortedData = data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const earliestDate = sortedData[0]?.date
    ? new Date(sortedData[0].date)
    : undefined;
  const latestDate = sortedData[sortedData.length - 1]?.date
    ? new Date(sortedData[sortedData.length - 1]!.date)
    : undefined;

  return (
    <ChartContainer<T>
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
      <>
        <Card className="w-full">
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <div className="aspect-auto h-[400px] w-full">
              <BaseChartContainer
                config={chartConfig}
                className="aspect-auto h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </BaseChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex flex-1 justify-between items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              {isTrendingUp ? (
                <>
                  Trending up by{" "}
                  <span className="text-[#2DB78A]">
                    {percentageChange.toFixed(2)}%{" "}
                  </span>{" "}
                  this period{" "}
                  <TrendingUp className="inline text-[#2DB78A] h-4 w-4" />
                </>
              ) : (
                <>
                  Trending down by{" "}
                  <span className="text-[#E2366F]">
                    {Math.abs(percentageChange).toFixed(2)}%{" "}
                  </span>{" "}
                  this period{" "}
                  <TrendingDown className="inline text-[#E2366F] h-4 w-4" />
                </>
              )}
              {footerDescription && (
                <div className="leading-none text-muted-foreground">
                  {footerDescription}
                </div>
              )}
            </div>

            {!disableViewMore && (
              <Button
                variant="ghost"
                onClick={() => setIsSheetOpen(true)}
                className="text-sm"
              >
                View More
                <BiRightArrow className="inline ml-1" />
              </Button>
            )}
          </CardFooter>
        </Card>

        {!disableViewMore && (
          <DetailedAnalyticsSheet<T>
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            formattedData={formattedData}
            dataKeys={dataKeys}
            getLabel={getLabel}
            colors={colors} // Add this line
          />
        )}
        {/* Drilldown Dialog */}
        {drilldownData && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={() => setIsDialogOpen(false)}
          >
            <DialogContent className="sm:max-w-[600px] p-[2%]">
              <DialogHeader>
                <DialogTitle>Detailed Insights</DialogTitle>
                <DialogDescription>
                  Analysis for {formatDate(drilldownData.date)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                {dataKeys.map((key) => {
                  const value = Number(drilldownData[key]);
                  return (
                    <div key={key as string}>
                      <h3 className="text-lg font-semibold">
                        {key as string}:{" "}
                        {isNaN(value)
                          ? "N/A"
                          : yAxisFormatter
                            ? yAxisFormatter(value)
                            : getLabel(Number(value.toFixed(2)))}
                      </h3>
                      <p>Activity Level: {getActivityLevel(value)}</p>
                    </div>
                  );
                })}
                <div>
                  <h4 className="font-semibold">Recommendations:</h4>
                  <ul className="list-disc pl-5">
                    {getRecommendations(
                      Number(drilldownData[trendKey]) || 0,
                    ).map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    </ChartContainer>
  );
};

interface DetailedAnalyticsSheetProps<T extends BarChartMultiDataPoint> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formattedData: T[];
  dataKeys: (keyof T)[];
  getLabel: (value: number) => string;
  colors: string[]; // Add this line
}

const COLORS = [
  "#1A1A1A",
  "#333333",
  "#4D4D4D",
  "#666666",
  "#808080",
  "#999999",
];

const DetailedAnalyticsSheet = <T extends BarChartMultiDataPoint>({
  isOpen,
  onOpenChange,
  formattedData,
  dataKeys,
  getLabel,
  colors, // Add this prop
}: DetailedAnalyticsSheetProps<T>) => {
  const [selectedMetric, setSelectedMetric] = useState<keyof T>(dataKeys[0]!);

  const getDataSummary = () =>
    dataKeys.reduce(
      (acc, key) => {
        const values = formattedData.map((item) => Number(item[key]));
        acc[key as string] = {
          min: Math.min(...values),
          max: Math.max(...values),
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          total: values.reduce((sum, val) => sum + val, 0),
        };
        return acc;
      },
      {} as Record<
        string,
        { min: number; max: number; average: number; total: number }
      >,
    );

  const getTopPerformers = () =>
    dataKeys.map((key) => ({
      key,
      topDays: [...formattedData]
        .sort((a, b) => Number(b[key]) - Number(a[key]))
        .slice(0, 5)
        .map((item) => ({
          date: format(new Date(item.date), "MMM dd, yyyy"),
          value: Number(item[key]),
        })),
    }));

  const getGrowthRate = () =>
    dataKeys.map((key) => {
      const firstValue = Number(formattedData[0]?.[key] ?? 0);
      const lastValue = Number(
        formattedData[formattedData.length - 1]?.[key] ?? 0,
      );
      const growthRate =
        firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
      return { key, growthRate };
    });

  const getMetricInsights = (metric: keyof T) => {
    const values = formattedData.map((item) => Number(item[metric]));
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const lastValue = values[values.length - 1] ?? 0;
    const firstValue = values[0] ?? 0;
    const percentChange =
      firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    return {
      average,
      lastValue,
      percentChange,
      trend: percentChange >= 0 ? "up" : "down",
    };
  };

  const getCorrelations = () => {
    const correlations: {
      metric1: string;
      metric2: string;
      correlation: number;
    }[] = [];
    for (let i = 0; i < dataKeys.length; i++) {
      for (let j = i + 1; j < dataKeys.length; j++) {
        const metric1 = dataKeys[i] as keyof T;
        const metric2 = dataKeys[j] as keyof T;
        const values1 = formattedData.map((item) => Number(item[metric1] ?? 0));
        const values2 = formattedData.map((item) => Number(item[metric2] ?? 0));
        correlations.push({
          metric1: String(metric1),
          metric2: String(metric2),
          correlation: calculateCorrelation(values1, values2),
        });
      }
    }
    return correlations.sort(
      (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
    );
  };

  const calculateCorrelation = (x: number[], y: number[]) => {
    const n = x.length;
    const sum_x = x.reduce((a, b) => a + b, 0);
    const sum_y = y.reduce((a, b) => a + b, 0);
    const sum_xy = x.reduce((total, xi, i) => total + xi * y[i]!, 0);
    const sum_x2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sum_y2 = y.reduce((total, yi) => total + yi * yi, 0);
    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt(
      (n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y),
    );
    return numerator / denominator;
  };

  const getPieChartData = (data: Record<string, number>) =>
    Object.entries(data).map(([name, value]) => ({ name, value }));

  const getBarChartData = (summary: ReturnType<typeof getDataSummary>) =>
    Object.entries(summary).map(([key, values]) => ({
      name: key,
      min: values.min,
      max: values.max,
      average: values.average,
    }));

  const getAreaChartData = () =>
    formattedData.map((item) => ({
      date: format(new Date(item.date), "MMM dd, yyyy"),
      ...Object.fromEntries(dataKeys.map((key) => [key, Number(item[key])])),
    }));

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[70%] overflow-y-auto scroll-smooth  bg-background text-foreground">
        <SheetHeader>
          <SheetTitle>Detailed Analytics</SheetTitle>
          <SheetDescription>
            In-depth analysis of your financial data
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid grid-cols-4 gap-2 mb-6">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="topPerformers">Top Performers</TabsTrigger>
              <TabsTrigger value="growthRates">Growth Rates</TabsTrigger>
            </TabsList>
            <div className="mt-8">
              <TabsContent value="summary" className="flex flex-col gap-3">
                <SummaryTab<T>
                  dataKeys={dataKeys}
                  getMetricInsights={(metric: keyof T) => {
                    const insights = getMetricInsights(metric);
                    return {
                      ...insights,
                      trend: insights.trend as "up" | "down",
                    };
                  }}
                  getDataSummary={getDataSummary}
                  getLabel={getLabel}
                />
                <DetailedDataTab<T>
                  formattedData={formattedData}
                  dataKeys={dataKeys}
                  getLabel={getLabel}
                />
              </TabsContent>
              <TabsContent value="trends">
                <TrendsTab<T>
                  formattedData={formattedData}
                  dataKeys={dataKeys}
                  selectedMetric={selectedMetric}
                  setSelectedMetric={setSelectedMetric}
                  getLabel={getLabel}
                  colors={colors} // Pass the colors prop
                  getCorrelations={getCorrelations}
                />
              </TabsContent>
              <TabsContent value="topPerformers">
                <TopPerformersTab<T>
                  getTopPerformers={getTopPerformers}
                  getLabel={getLabel}
                />
              </TabsContent>
              <TabsContent value="growthRates">
                <GrowthRatesTab<T>
                  getGrowthRate={getGrowthRate}
                  getAreaChartData={getAreaChartData}
                  dataKeys={dataKeys}
                  getLabel={getLabel}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SummaryTab = <T extends BarChartMultiDataPoint>({
  dataKeys,
  getMetricInsights,
  getDataSummary,
  getLabel,
}: {
  dataKeys: (keyof T)[];
  getMetricInsights: (metric: keyof T) => {
    average: number;
    lastValue: number;
    percentChange: number;
    trend: "up" | "down";
  };
  getDataSummary: () => Record<
    string,
    { min: number; max: number; average: number; total: number }
  >;
  getLabel: (value: number) => string;
}) => {
  const summary = getDataSummary();
  const pieChartData = Object.entries(summary).map(([key, values]) => ({
    name: key,
    value: values.total,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Key Metrics Overview</h3>
      <div className="grid grid-cols-1 gap-4">
        <EnhancedMetricInsights
          dataKeys={dataKeys}
          getMetricInsights={getMetricInsights}
          getLabel={getLabel}
        />
      </div>
      <div className="p-[2%]">
        <h3 className="text-lg font-semibold mt-6">Data Summary</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Max</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(summary).map(([key, values]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{getLabel(Number(values.min.toFixed(2)))}</TableCell>
                <TableCell>{getLabel(Number(values.max.toFixed(2)))}</TableCell>
                <TableCell>
                  {getLabel(Number(values.average.toFixed(2)))}
                </TableCell>
                <TableCell>
                  {getLabel(Number(values.total.toFixed(2)))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-[2%]">
        <h3 className="text-lg font-semibold mt-6">Total Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => getLabel(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const TrendsTab = <T extends BarChartMultiDataPoint>({
  formattedData,
  dataKeys,
  selectedMetric,
  setSelectedMetric,
  getLabel,
  colors,
  getCorrelations,
}: {
  formattedData: T[];
  dataKeys: (keyof T)[];
  selectedMetric: keyof T;
  setSelectedMetric: (metric: keyof T) => void;
  getLabel: (value: number) => string;
  colors: string[];
  getCorrelations: () => {
    metric1: string;
    metric2: string;
    correlation: number;
  }[];
}) => {
  // Create a config object for InteractiveBarChart
  const chartConfig = useMemo(() => {
    return dataKeys.reduce(
      (config, key, index) => {
        config[key as string] = {
          label: String(key),
          color: colors[index] || `hsl(var(--chart-${index + 1}))`,
        };
        return config;
      },
      {} as Record<string, { label: string; color: string }>,
    );
  }, [dataKeys, colors]);

  const correlations = getCorrelations();

  // Simple linear regression forecast
  const forecast = (data: number[]) => {
    const n = data.length;
    const sum_x = data.reduce((sum, _, i) => sum + i, 0);
    const sum_y = data.reduce((sum, value) => sum + value, 0);
    const sum_xy = data.reduce((sum, value, i) => sum + i * value, 0);
    const sum_xx = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;

    return intercept + slope * n;
  };

  return (
    <div className="space-y-4 flex flex-col gap-2">
      <InteractiveBarChart
        data={formattedData}
        config={chartConfig}
        title="Trend Analysis"
        description="Interactive view of trends over time"
        height={400}
      />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Correlations</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric 1</TableHead>
              <TableHead>Metric 2</TableHead>
              <TableHead>Correlation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {correlations.map(({ metric1, metric2, correlation }, index) => (
              <TableRow key={index}>
                <TableCell>{metric1}</TableCell>
                <TableCell>{metric2}</TableCell>
                <TableCell>{correlation.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Forecasts</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Current Value</TableHead>
              <TableHead>Forecasted Next Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataKeys.map((key) => {
              const data = formattedData.map((item) => Number(item[key]));
              const currentValue = data[data.length - 1] ?? 0;
              const forecastedValue = forecast(data);
              return (
                <TableRow key={String(key)}>
                  <TableCell>{String(key)}</TableCell>
                  <TableCell>{getLabel(currentValue)}</TableCell>
                  <TableCell>{getLabel(forecastedValue)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const TopPerformersTab = <T extends BarChartMultiDataPoint>({
  getTopPerformers,
  getLabel,
}: {
  getTopPerformers: () => {
    key: keyof T;
    topDays: { date: string; value: number }[];
  }[];
  getLabel: (value: number) => string;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top Performers</h3>
      {getTopPerformers().map(({ key, topDays }) => (
        <div key={String(key)} className="mb-4">
          <h4 className="font-medium mb-2">{String(key)}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDays.map((day, index) => (
                <TableRow key={index}>
                  <TableCell>{day.date}</TableCell>
                  <TableCell>
                    {getLabel(Number(day.value.toFixed(2)))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};

const GrowthRatesTab = <T extends BarChartMultiDataPoint>({
  getGrowthRate,
  getAreaChartData,
  dataKeys,
  getLabel,
}: {
  getGrowthRate: () => { key: keyof T; growthRate: number }[];
  getAreaChartData: () => any[];
  dataKeys: (keyof T)[];
  getLabel: (value: number) => string;
}) => {
  const growthRates = getGrowthRate();
  const pieChartData = growthRates.map(({ key, growthRate }) => ({
    name: String(key),
    value: Math.abs(growthRate),
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Growth Rates</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>Growth Rate</TableHead>
            <TableHead>Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {growthRates.map(({ key, growthRate }) => (
            <TableRow key={String(key)}>
              <TableCell>{String(key)}</TableCell>
              <TableCell>{growthRate.toFixed(2)}%</TableCell>
              <TableCell>
                {growthRate > 0 ? (
                  <TrendingUp className="inline text-green-500 h-4 w-4" />
                ) : (
                  <TrendingDown className="inline text-red-500 h-4 w-4" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <h3 className="text-lg font-semibold mt-6">Growth Rate Distribution</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <h4 className="text-md font-semibold mt-4">Trend Over Time</h4>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={getAreaChartData()}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => getLabel(Number(value))} />
          <Legend />
          {dataKeys.map((key, index) => (
            <Area
              key={String(key)}
              type="monotone"
              dataKey={String(key)}
              stackId="1"
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const DetailedDataTab = <T extends BarChartMultiDataPoint>({
  formattedData,
  dataKeys,
  getLabel,
}: {
  formattedData: T[];
  dataKeys: (keyof T)[];
  getLabel: (value: number) => string;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Detailed Data Table</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {dataKeys.map((key) => (
              <TableHead key={String(key)}>{String(key)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {formattedData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.date}</TableCell>
              {dataKeys.map((key) => (
                <TableCell key={String(key)}>
                  {getLabel(Number(Number(item[key]).toFixed(2)))}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const MetricInsightCard = ({
  metric,
  insights,
  getLabel,
}: {
  metric: string;
  insights: {
    average: number;
    lastValue: number;
    percentChange: number;
    trend: "up" | "down";
    max?: number;
  };
  getLabel: (value: number) => string;
}) => {
  const trendColor =
    insights.trend === "up" ? "text-green-500" : "text-red-500";
  const TrendIcon = insights.trend === "up" ? TrendingUp : TrendingDown;
  const progressValue =
    insights.max !== undefined ? (insights.lastValue / insights.max) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{String(metric)}</CardTitle>
        {metric.toLowerCase().includes("revenue") ? (
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Activity className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {getLabel(Number(insights.lastValue.toFixed(2)))}
        </div>
        <p className="text-xs text-muted-foreground">
          {insights.trend === "up" ? "Increased" : "Decreased"} by{" "}
          {Math.abs(insights.percentChange).toFixed(2)}%
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-sm font-medium">
              {getLabel(Number(insights.average.toFixed(2)))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="text-sm font-medium">
              {insights.max !== undefined
                ? getLabel(Number(insights.max.toFixed(2)))
                : "N/A"}
            </p>
          </div>
        </div>
        <Progress value={progressValue} className="mt-4" />
        <div className="mt-2 flex items-center">
          <TrendIcon className={`mr-2 h-4 w-4 ${trendColor}`} />
          <span className={`text-xs font-medium ${trendColor}`}>
            {insights.trend === "up" ? "Trending Up" : "Trending Down"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const EnhancedMetricInsights: <T extends BarChartMultiDataPoint>({
  dataKeys,
  getMetricInsights,
  getLabel,
}: {
  dataKeys: (keyof T)[];
  getMetricInsights: (metric: keyof T) => {
    average: number;
    lastValue: number;
    percentChange: number;
    trend: "up" | "down";
  };
  getLabel: (value: number) => string;
}) => JSX.Element = ({ dataKeys, getMetricInsights, getLabel }) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {dataKeys.map((key) => {
        const insights = getMetricInsights(key);
        return (
          <MetricInsightCard
            key={String(key)}
            metric={key.toString()}
            insights={insights}
            getLabel={getLabel}
          />
        );
      })}
    </div>
  );
};

export { AnalyticsChart };
