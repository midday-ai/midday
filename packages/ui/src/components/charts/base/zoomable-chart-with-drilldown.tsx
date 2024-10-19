import { format, isValid, parseISO } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "../../chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../dialog";

/**
 * Represents a single data point in the chart.
 */
export type DataPoint = {
  /** ISO 8601 formatted date string */
  date: string;
  /** Number of events for this data point */
  events: number;
};

/**
 * Props for the ZoomableChartWithDrilldown component.
 */
export type ZoomableChartWithDrilldownProps = {
  /** Array of data points to be displayed in the chart */
  data?: DataPoint[];
  /** Optional description of the chart */
  description?: string;
  /** Optional title for the chart */
  title?: string;
  /** Key to use for the data name (defaults to "events") */
  dataNameKey?: string;
  /** Height of the chart in pixels (defaults to 400) */
  height?: number;
  /** Optional description for the chart footer */
  footerDescription?: string;
  /** Chart type: 'area' or 'bar' or 'line' (defaults to 'area') */
  chartType?: "area" | "bar" | "line";
  /** Callback function for drilldown action */
  onDrilldown?: (startDate: string, endDate: string) => void;
  /** Callback function for share action */
  onShare?: () => void;
  /** Callback function for export to model action */
  onExportToModel?: () => void;
};

const chartConfig = {
  events: {
    label: "Events",
    color: "#333",
  },
} satisfies ChartConfig;

/**
 * A zoomable and interactive chart component that displays event data over time.
 *
 * This component renders a chart with the following features:
 * - Zooming functionality using mouse wheel or touch pinch gestures
 * - Click and drag to select a specific time range
 * - Drilldown capability for more detailed analysis
 * - Sharing options for reports
 * - Export functionality for financial modeling
 * - Responsive design that adapts to different screen sizes
 * - Customizable title, description, and data key
 * - Interactive tooltip showing detailed information for each data point
 * - Detailed drilldown dialog for individual data points
 *
 * @param props - The props for the ZoomableChartWithDrilldown component
 * @returns A React component rendering the zoomable chart
 */
export function ZoomableChartWithDrilldown({
  data: initialData,
  description,
  title,
  dataNameKey = "events",
  height = 400,
  footerDescription,
  chartType = "area",
  onDrilldown,
  onShare,
  onExportToModel,
}: ZoomableChartWithDrilldownProps) {
  const [data, setData] = useState<DataPoint[]>(initialData || []);
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<DataPoint[]>(
    initialData || [],
  );
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData && initialData?.length > 0) {
      setData(initialData);
      setOriginalData(initialData);
      setStartTime(initialData[0]!.date);
      setEndTime(initialData[initialData.length - 1]!.date);
    }
  }, [initialData]);

  const zoomedData = useMemo(() => {
    if (!startTime || !endTime) {
      return data;
    }

    const dataPointsInRange = originalData.filter(
      (dataPoint) => dataPoint.date >= startTime && dataPoint.date <= endTime,
    );

    return dataPointsInRange.length > 1
      ? dataPointsInRange
      : originalData.slice(0, 2);
  }, [startTime, endTime, originalData, data]);

  const total = useMemo(
    () => zoomedData.reduce((acc, curr) => acc + curr.events, 0),
    [zoomedData],
  );

  const handleMouseDown = (e: any) => {
    if (e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
      setIsSelecting(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft && refAreaRight) {
      const [left, right] = [refAreaLeft, refAreaRight].sort();
      setStartTime(left as string);
      setEndTime(right as string);
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setIsSelecting(false);
  };

  const handleReset = () => {
    if (!originalData.length) return;

    setStartTime(originalData[0]!.date);
    setEndTime(originalData[originalData.length - 1]!.date);
  };

  const handleZoom = (
    e: React.WheelEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    if (originalData.length === 0 || !originalData.length || !chartRef.current)
      return;

    let zoomFactor = 0.1;
    let direction = 0;
    let clientX = 0;

    if ("deltaY" in e) {
      direction = e.deltaY < 0 ? 1 : -1;
      clientX = e.clientX;
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      if (!touch1 || !touch2) return;

      const currentDistance = Math.hypot(
        touch1?.clientX - touch2?.clientX,
        touch1?.clientY - touch2?.clientY,
      );

      if ((e as any).lastTouchDistance) {
        direction = currentDistance > (e as any).lastTouchDistance ? 1 : -1;
      }
      (e as any).lastTouchDistance = currentDistance;

      clientX = (touch1.clientX + touch2.clientX) / 2;
    } else {
      return;
    }

    const currentRange =
      new Date(
        endTime || originalData[originalData.length - 1]!.date,
      ).getTime() - new Date(startTime || originalData[0]!.date).getTime();
    const zoomAmount = currentRange * zoomFactor * direction;

    const chartRect = chartRef.current.getBoundingClientRect();
    const mouseX = clientX - chartRect.left;
    const chartWidth = chartRect.width;
    const mousePercentage = mouseX / chartWidth;

    const currentStartTime = new Date(
      startTime || originalData[0]!.date,
    ).getTime();
    const currentEndTime = new Date(
      endTime || originalData[originalData.length - 1]!.date,
    ).getTime();

    const newStartTime = new Date(
      currentStartTime + zoomAmount * mousePercentage,
    );
    const newEndTime = new Date(
      currentEndTime - zoomAmount * (1 - mousePercentage),
    );

    setStartTime(newStartTime.toISOString());
    setEndTime(newEndTime.toISOString());
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleDrilldown = () => {
    if (startTime && endTime && onDrilldown) {
      onDrilldown(startTime, endTime);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  const handleExportToModel = () => {
    if (onExportToModel) {
      onExportToModel();
    }
  };

  const handleDataPointClick = (data: any) => {
    setSelectedDataPoint(data);
    setIsDialogOpen(true);
  };

  const getSurroundingData = (
    selectedPoint: DataPoint,
    allData: DataPoint[],
  ) => {
    const index = allData.findIndex((d) => d.date === selectedPoint.date);
    const start = Math.max(0, index - 7);
    const end = Math.min(allData.length, index + 8);
    return allData.slice(start, end);
  };

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <Bar
          type="monotone"
          dataKey="events"
          stroke={chartConfig.events.color}
          fill={chartConfig.events.color}
          isAnimationActive={false}
        />
      );
    } else if (chartType === "area") {
      return (
        <Area
          type="monotone"
          dataKey="events"
          stroke={chartConfig.events.color}
          fillOpacity={1}
          fill="url(#colorEvents)"
          isAnimationActive={false}
        />
      );
    } else {
      return (
        <Line
          type="monotone"
          dataKey="events"
          stroke={chartConfig.events.color}
          isAnimationActive={false}
        />
      );
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex-col items-stretch space-y-0 border-b p-0 sm:flex-row hidden sm:flex">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l bg-muted/10 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              {capitalizeFirstLetter(dataNameKey)}
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 h-full sm:h-[calc(100%-150px)]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <div
            className="h-full"
            onWheel={handleZoom}
            onTouchMove={handleZoom}
            ref={chartRef}
            style={{ touchAction: "none" }}
          >
            <div className="flex justify-between my-2 sm:mb-4">
              <div>
                <Button
                  variant="outline"
                  onClick={handleDrilldown}
                  className="text-xs sm:text-sm mr-2"
                >
                  Drilldown
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="text-xs sm:text-sm mr-2"
                >
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportToModel}
                  className="text-xs sm:text-sm"
                >
                  Export to Model
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!startTime && !endTime}
                className="text-xs sm:text-sm"
              >
                Reset
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={zoomedData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleDataPointClick}
              >
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartConfig.events.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartConfig.events.color}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} horizontal={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  minTickGap={16}
                  style={{ fontSize: "10px", userSelect: "none" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "10px", userSelect: "none" }}
                  width={30}
                />
                <Tooltip content={<EnhancedTooltip />} />
                <ChartLegend
                  content={
                    <ChartLegendContent
                      nameKey={dataNameKey}
                      hideIcon={false}
                      hidden={false}
                    />
                  }
                />
                {renderChart()}
                {refAreaLeft && refAreaRight && (
                  <ReferenceArea
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                    fill="hsl(var(--foreground))"
                    fillOpacity={0.05}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>
      {footerDescription && (
        <CardFooter className="text-sm text-muted-foreground p-[3%] border-t">
          {footerDescription}
        </CardFooter>
      )}
      {/* Drilldown Dialog */}
      {selectedDataPoint && (
        <DrilldownDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          dataPoint={selectedDataPoint}
          surroundingData={
            selectedDataPoint ? getSurroundingData(selectedDataPoint, data) : []
          }
          onDrilldown={onDrilldown}
        />
      )}
    </Card>
  );
}

const EnhancedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded shadow">
        <p className="font-bold">{`Date: ${new Date(label).toLocaleString()}`}</p>
        <p>{`Events: ${data.events}`}</p>
        <p className="text-sm text-gray-500 mt-2">
          Click for detailed insights
        </p>
      </div>
    );
  }
  return null;
};

interface DrilldownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dataPoint: DataPoint | null;
  surroundingData: DataPoint[];
  onDrilldown?: (startDate: string, endDate: string) => void;
}

const DrilldownDialog: React.FC<DrilldownDialogProps> = ({
  isOpen,
  onClose,
  dataPoint,
  surroundingData,
  onDrilldown,
}) => {
  if (!dataPoint) return null;

  const parseDate = (dateInput: string): Date => {
    if (!dateInput) {
      console.error("Invalid date input: undefined or null");
      return new Date();
    }

    try {
      const date = parseISO(dateInput);
      if (isValid(date)) return date;

      // If parseISO fails, try creating a new Date object
      const fallbackDate = new Date(dateInput);
      if (isValid(fallbackDate)) return fallbackDate;

      throw new Error("Invalid date");
    } catch (error) {
      console.error("Error parsing date:", error, "Input:", dateInput);
      return new Date(); // Return current date as fallback
    }
  };

  const date = parseDate(dataPoint.date);

  const handleDrilldown = () => {
    if (onDrilldown) {
      const start = date;
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later
      onDrilldown(start.toISOString(), end.toISOString());
    }
    onClose();
  };

  const getActivityLevel = (events: number) => {
    if (events > 50) return "High";
    if (events > 20) return "Moderate";
    return "Low";
  };

  const getPersonalFinanceRecommendations = (events: number) => {
    const activityLevel = getActivityLevel(events);
    switch (activityLevel) {
      case "High":
        return [
          "Review your high number of transactions for any unnecessary spending",
          "Check if any subscriptions or recurring payments have increased",
          "Consider setting up automated savings for excess funds",
          "Ensure your high activity isn't leading to overdraft fees",
          "Look into rewards programs that benefit frequent transactions",
        ];
      case "Moderate":
        return [
          "Analyze your spending patterns to identify areas for potential savings",
          "Review your budget to ensure it aligns with your current spending",
          "Consider setting financial goals based on your consistent activity",
          "Look into automating bill payments to streamline your finances",
          "Check if your current financial products suit your activity level",
        ];
      case "Low":
        return [
          "Review your budget to ensure all necessary expenses are accounted for",
          "Look for opportunities to increase your savings or investments",
          "Check for any forgotten subscriptions or services you're not using",
          "Consider if your low activity indicates a need for better tracking",
          "Explore ways to diversify your income or increase cash flow",
        ];
    }
  };

  const calculateTrend = () => {
    const index = surroundingData.findIndex((d) => d.date === dataPoint.date);
    if (index > 0 && index < surroundingData.length - 1) {
      const prev = surroundingData[index - 1]!.events;
      const next = surroundingData[index + 1]!.events;
      if (dataPoint.events > prev && dataPoint.events > next) return "Peak";
      if (dataPoint.events < prev && dataPoint.events < next) return "Valley";
      if (dataPoint.events > prev) return "Rising";
      if (dataPoint.events < prev) return "Falling";
    }
    return "Stable";
  };

  const calculateAverage = () => {
    if (surroundingData.length === 0) return 0;
    const sum = surroundingData.reduce((acc, curr) => acc + curr.events, 0);
    return sum / surroundingData.length;
  };

  const findSimilarDays = () => {
    const dayOfWeek = format(date, "EEEE");
    return surroundingData.filter((d) => {
      const currentDate = parseDate(d.date);
      return format(currentDate, "EEEE") === dayOfWeek;
    });
  };

  const calculateAverageForSimilarDays = (similarDays: DataPoint[]) => {
    if (similarDays.length === 0) return "No data";
    const sum = similarDays.reduce((acc, curr) => acc + curr.events, 0);
    return (sum / similarDays.length).toFixed(2);
  };

  const average = calculateAverage();
  const trend = calculateTrend();
  const similarDays = findSimilarDays();
  const averageForSimilarDays = calculateAverageForSimilarDays(similarDays);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-[2%]">
        <DialogHeader>
          <DialogTitle>Personal Finance Insights</DialogTitle>
          <DialogDescription>
            Financial activity analysis for {format(date, "PPpp")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Transaction Count: {dataPoint.events}
            </h3>
            <p>Time of Day: {format(date, "p")}</p>
            <p>Day of Week: {format(date, "EEEE")}</p>
          </div>
          <div>
            <h4 className="font-semibold">Trend Analysis:</h4>
            <p>
              This is a {getActivityLevel(dataPoint.events).toLowerCase()}{" "}
              activity period.
            </p>
            <p>
              Current trend: <span className="font-medium">{trend}</span>
            </p>
            <p>
              Average transactions in this period:{" "}
              <span className="font-medium">{average.toFixed(2)}</span>
            </p>
            <p>
              This day is {dataPoint.events > average ? "above" : "below"}{" "}
              average by{" "}
              <span className="font-medium">
                {Math.abs(dataPoint.events - average).toFixed(2)}
              </span>{" "}
              transactions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Comparative Analysis:</h4>
            <p>
              Average transactions on {format(date, "EEEE")}s:
              <span className="font-medium"> {averageForSimilarDays}</span>
            </p>
            {averageForSimilarDays !== "No data" && (
              <p>
                This {format(date, "EEEE")} is{" "}
                {dataPoint.events > parseFloat(averageForSimilarDays)
                  ? "more"
                  : "less"}{" "}
                active than usual.
              </p>
            )}
          </div>
          <div>
            <h4 className="font-semibold">Recommendations:</h4>
            <ul className="list-disc pl-5">
              {getPersonalFinanceRecommendations(dataPoint.events).map(
                (rec, index) => (
                  <li key={index}>{rec}</li>
                ),
              )}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={handleDrilldown}>Further Drilldown</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Simulates data for the ZoomableChartWithDrilldown.
 *
 * @param start - Start date for the simulated data (default: '2024-01-01T00:00:00Z')
 * @param end - End date for the simulated data (default: '2024-01-02T00:00:00Z')
 * @returns An array of DataPoint objects representing simulated event data
 */
export function simulateData(
  start = "2024-01-01T00:00:00Z",
  end = "2024-01-02T00:00:00Z",
): DataPoint[] {
  const simulatedData = [];
  let baseValue = 50;
  for (
    let currentDate = new Date(start);
    currentDate <= new Date(end);
    currentDate.setTime(currentDate.getTime() + 600000)
  ) {
    const seed = currentDate.getTime();
    baseValue = Math.max(
      (baseValue +
        ((0.5 * (currentDate.getTime() - new Date(start).getTime())) /
          (new Date(end).getTime() - new Date(start).getTime())) *
          100 +
        (seedRandom(seed) - 0.5) * 20 +
        (seedRandom(seed + 1) < 0.1 ? (seedRandom(seed + 2) - 0.5) * 50 : 0) +
        Math.sin(currentDate.getTime() / 3600000) * 10) *
        (1 + (seedRandom(seed + 3) - 0.5) * 0.2),
      1,
    );
    simulatedData.push({
      date: currentDate.toISOString(),
      events: Math.max(Math.floor(baseValue), 1),
    });
  }
  return simulatedData;
}

/**
 * Simple random number generator based on a seed
 */
const seedRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};
