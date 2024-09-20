'use client'
import { useEffect, useMemo, useRef, useState } from "react"
import { Area, Bar, CartesianGrid, ComposedChart, Line, Radar, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Button } from "../../button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../card"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "../../chart"

/**
 * Represents a single data point in the chart.
 */
type DataPoint = {
    /** ISO 8601 formatted date string */
    date: string;
    /** Number of events for this data point */
    events: number;
};

/**
 * Props for the ZoomableChart component.
 */
export type ZoomableChartProps = {
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
    /** Chart type: 'area' or 'bar' or 'line' or 'pie' (defaults to 'area') */
    chartType?: 'area' | 'bar' | 'line';
};

const chartConfig = {
    events: {
        label: "Events",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

const seedRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

/**
 * Simulates data for the ZoomableChart.
 * 
 * @param start - Start date for the simulated data (default: '2024-01-01T00:00:00Z')
 * @param end - End date for the simulated data (default: '2024-01-02T00:00:00Z')
 * @returns An array of DataPoint objects representing simulated event data
 */
export function simulateData(start = '2024-01-01T00:00:00Z', end = '2024-01-02T00:00:00Z'): DataPoint[] {
    const simulatedData = [];
    let baseValue = 50;
    for (let currentDate = new Date(start); currentDate <= new Date(end); currentDate.setTime(currentDate.getTime() + 600000)) {
        const seed = currentDate.getTime();
        baseValue = Math.max(
            (baseValue + 0.5 * (currentDate.getTime() - new Date(start).getTime()) / (new Date(end).getTime() - new Date(start).getTime()) * 100 +
                (seedRandom(seed) - 0.5) * 20 +
                (seedRandom(seed + 1) < 0.1 ? (seedRandom(seed + 2) - 0.5) * 50 : 0) +
                Math.sin(currentDate.getTime() / 3600000) * 10) *
            (1 + (seedRandom(seed + 3) - 0.5) * 0.2),
            1
        );
        simulatedData.push({
            date: currentDate.toISOString(),
            events: Math.max(Math.floor(baseValue), 1)
        });
    }
    return simulatedData;
}

/**
 * A zoomable and interactive chart component that displays event data over time.
 * 
 * This component renders a chart with the following features:
 * - Zooming functionality using mouse wheel or touch pinch gestures
 * - Click and drag to select a specific time range
 * - Responsive design that adapts to different screen sizes
 * - Customizable title, description, and data key
 * - Interactive tooltip showing detailed information for each data point
 * 
 * @param props - The props for the ZoomableChart component
 * @returns A React component rendering the zoomable chart
 */
export function ZoomableChart({ data: initialData, description, title, dataNameKey = "events", height = 400, footerDescription, chartType = 'area' }: ZoomableChartProps) {
    const [data, setData] = useState<DataPoint[]>(initialData || []);
    const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
    const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [originalData, setOriginalData] = useState<DataPoint[]>(initialData || []);
    const [isSelecting, setIsSelecting] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    /**
     * Initializes the chart data and time range when initialData changes.
     */
    useEffect(() => {
        if (initialData?.length) {
            setData(initialData);
            setOriginalData(initialData);
            setStartTime(initialData[0].date);
            setEndTime(initialData[initialData.length - 1].date);
        }
    }, [initialData]);

    /**
     * Calculates the data to be displayed based on the current zoom level.
     */
    const zoomedData = useMemo(() => {
        if (!startTime || !endTime) {
            return data;
        }

        const dataPointsInRange = originalData.filter(
            (dataPoint) => dataPoint.date >= startTime && dataPoint.date <= endTime
        );

        // Ensure we have at least two data points for the chart to prevent rendering a single dot
        return dataPointsInRange.length > 1 ? dataPointsInRange : originalData.slice(0, 2);
    }, [startTime, endTime, originalData, data]);

    /**
     * Calculates the total number of events in the currently displayed data range.
     */
    const total = useMemo(
        () => zoomedData.reduce((acc, curr) => acc + curr.events, 0),
        [zoomedData]
    )

    /**
     * Handles the start of a selection drag operation.
     */
    const handleMouseDown = (e: any) => {
        if (e.activeLabel) {
            setRefAreaLeft(e.activeLabel);
            setIsSelecting(true);
        }
    };

    /**
     * Updates the selection area during a drag operation.
     */
    const handleMouseMove = (e: any) => {
        if (isSelecting && e.activeLabel) {
            setRefAreaRight(e.activeLabel);
        }
    };

    /**
     * Finalizes the selection area and updates the chart's time range.
     */
    const handleMouseUp = () => {
        if (refAreaLeft && refAreaRight) {
            const [left, right] = [refAreaLeft, refAreaRight].sort();
            setStartTime(left);
            setEndTime(right);
        }
        setRefAreaLeft(null);
        setRefAreaRight(null);
        setIsSelecting(false);
    };

    /**
     * Resets the chart to its original time range.
     */
    const handleReset = () => {
        setStartTime(originalData[0].date);
        setEndTime(originalData[originalData.length - 1].date);
    };

    /**
     * Handles zooming functionality for both mouse wheel and touch events.
     */
    const handleZoom = (e: React.WheelEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!originalData.length || !chartRef.current) return;

        let zoomFactor = 0.1;
        let direction = 0;
        let clientX = 0;

        if ('deltaY' in e) {
            // Mouse wheel event
            direction = e.deltaY < 0 ? 1 : -1;
            clientX = e.clientX;
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

            if ((e as any).lastTouchDistance) {
                direction = currentDistance > (e as any).lastTouchDistance ? 1 : -1;
            }
            (e as any).lastTouchDistance = currentDistance;

            clientX = (touch1.clientX + touch2.clientX) / 2;
        } else {
            return;
        }

        const currentRange = new Date(endTime || originalData[originalData.length - 1].date).getTime() -
            new Date(startTime || originalData[0].date).getTime();
        const zoomAmount = currentRange * zoomFactor * direction;

        const chartRect = chartRef.current.getBoundingClientRect();
        const mouseX = clientX - chartRect.left;
        const chartWidth = chartRect.width;
        const mousePercentage = mouseX / chartWidth;

        const currentStartTime = new Date(startTime || originalData[0].date).getTime();
        const currentEndTime = new Date(endTime || originalData[originalData.length - 1].date).getTime();

        const newStartTime = new Date(currentStartTime + zoomAmount * mousePercentage);
        const newEndTime = new Date(currentEndTime - zoomAmount * (1 - mousePercentage));

        setStartTime(newStartTime.toISOString());
        setEndTime(newEndTime.toISOString());
    };

    /**
     * Formats the X-axis ticks to display time in a readable format.
     */
    const formatXAxis = (tickItem: string) => {
        const date = new Date(tickItem);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    /**
     * Capitalizes the first letter of a string.
     */
    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const renderChart = () => {
        if (chartType === 'bar') {
            return (
                <Bar
                    type="monotone"
                    dataKey="events"
                    stroke={chartConfig.events.color}
                    fill={chartConfig.events.color}
                    isAnimationActive={false}
                />
            );
        } else if (chartType === 'area') {
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
        }  else {
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

    console.log("details", {
        data,
        zoomedData,
        startTime,
        endTime,
        originalData,
        total,
    })

    return (
        <Card className="w-full h-full">
            <CardHeader className="flex-col items-stretch space-y-0 border-b p-0 sm:flex-row hidden sm:flex">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && (
                        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
                    )}
                </div>
                <div className="flex">
                    <div
                        className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l bg-muted/10 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                    >
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
                <ChartContainer
                    config={chartConfig}
                    className="w-full h-full"
                >
                    <div className="h-full" onWheel={handleZoom} onTouchMove={handleZoom} ref={chartRef} style={{ touchAction: 'none' }}>
                        <div className="flex justify-end my-2 sm:mb-4">
                            <Button variant="outline" onClick={handleReset} disabled={!startTime && !endTime} className="text-xs sm:text-sm">
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
                            >
                                <defs>
                                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartConfig.events.color} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={chartConfig.events.color} stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatXAxis}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={4}
                                    minTickGap={16}
                                    style={{ fontSize: '10px', userSelect: 'none' }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    style={{ fontSize: '10px', userSelect: 'none' }}
                                    width={30}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            className="w-[150px] sm:w-[200px] font-mono text-xs sm:text-sm"
                                            nameKey={dataNameKey}
                                            labelFormatter={(value) => new Date(value).toLocaleString()}
                                        />
                                    }
                                />
                                <ChartLegend content={<ChartLegendContent nameKey={dataNameKey} hideIcon={false} hidden={false} />} />
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
        </Card>
    )
}