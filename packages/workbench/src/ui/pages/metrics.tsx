import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Clock,
  Hourglass,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SummaryCard } from "@/components/metrics/summary-card";
import { Badge } from "@/components/ui/badge";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  type ChartConfig,
  ChartContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { FailingJobType, SlowestJob } from "@/core/types";
import { useMetrics } from "@/lib/hooks";
import { cn, formatDuration } from "@/lib/utils";

// Chart configuration using theme variables
const throughputChartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-completed))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-failed))",
  },
} satisfies ChartConfig;

const durationChartConfig = {
  duration: {
    label: "Duration",
    color: "hsl(var(--chart-duration))",
  },
  waitTime: {
    label: "Wait Time",
    color: "hsl(var(--chart-wait))",
  },
} satisfies ChartConfig;

function formatHour(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHourShort(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
  });
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey?: string;
  }>;
  label?: number;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !label) return null;

  return (
    <div className=" border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs font-medium mb-1.5">{formatHour(label)}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DurationTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !label) return null;

  // Map dataKey to chart config colors
  const getColor = (dataKey: string, fallbackColor?: string) => {
    if (dataKey === "duration") return "hsl(var(--chart-duration))";
    if (dataKey === "waitTime") return "hsl(var(--chart-wait))";
    return fallbackColor || "hsl(var(--muted-foreground))";
  };

  return (
    <div className=" border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs font-medium mb-1.5">{formatHour(label)}</p>
      <div className="space-y-1">
        {payload.map((entry) => {
          const color = entry.dataKey
            ? getColor(entry.dataKey, entry.color)
            : entry.color;
          return (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium tabular-nums">
                {formatDuration(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlowestJobsTable({ jobs }: { jobs: SlowestJob[] }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No completed jobs in the last 24 hours
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {jobs.map((job, index) => (
        <Link
          key={`${job.queueName}-${job.jobId}`}
          to="/queues/$queueName/jobs/$jobId"
          params={{ queueName: job.queueName, jobId: job.jobId }}
          className="flex items-center justify-between px-4 py-2.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted-foreground w-5 tabular-nums shrink-0">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{job.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {job.queueName}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            {formatDuration(job.duration)}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function FailingJobsTable({ jobs }: { jobs: FailingJobType[] }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No failed jobs in the last 24 hours
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {jobs.map((job, index) => (
        <div
          key={`${job.queueName}-${job.name}`}
          className="flex items-center justify-between px-4 py-2.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted-foreground w-5 tabular-nums shrink-0">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{job.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {job.queueName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground tabular-nums">
              {job.failCount}/{job.totalCount}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-xs",
                job.errorRate > 0.5
                  ? "border-status-error/50 text-status-error"
                  : job.errorRate > 0.2
                    ? "border-status-warning/50 text-status-warning"
                    : "",
              )}
            >
              {formatPercentage(job.errorRate)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {["throughput", "error-rate", "duration", "wait-time"].map((id) => (
          <div key={id} className=" border p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className=" border p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className=" border p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export function MetricsPage() {
  const { data: metrics, isLoading, error } = useMetrics();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !metrics) {
    return (
      <div className=" border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load metrics"}
        </p>
      </div>
    );
  }

  const { aggregate, slowestJobs, mostFailingTypes } = metrics;
  const { summary, buckets } = aggregate;

  // Calculate trend (compare first half vs second half of 24h period)
  const midpoint = Math.floor(buckets.length / 2);
  const firstHalf = buckets.slice(0, midpoint);
  const secondHalf = buckets.slice(midpoint);

  const firstHalfCompleted = firstHalf.reduce((sum, b) => sum + b.completed, 0);
  const secondHalfCompleted = secondHalf.reduce(
    (sum, b) => sum + b.completed,
    0,
  );
  const firstHalfFailed = firstHalf.reduce((sum, b) => sum + b.failed, 0);
  const secondHalfFailed = secondHalf.reduce((sum, b) => sum + b.failed, 0);

  // Prepare chart data
  const throughputData = buckets.map((b) => ({
    hour: b.hour,
    completed: b.completed,
    failed: b.failed,
  }));

  const durationData = buckets.map((b) => ({
    hour: b.hour,
    duration: b.avgDuration,
    waitTime: b.avgWaitTime,
  }));

  // Sparkline data (just the values)
  const throughputSparkline = buckets.map((b) => b.completed + b.failed);
  const errorSparkline = buckets.map((b) =>
    b.completed + b.failed > 0 ? b.failed / (b.completed + b.failed) : 0,
  );
  const durationSparkline = buckets.map((b) => b.avgDuration);
  const waitTimeSparkline = buckets.map((b) => b.avgWaitTime);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title="Throughput"
          value={summary.throughputPerHour.toLocaleString()}
          subtitle="jobs/hour avg"
          sparklineData={throughputSparkline}
          sparklineColor="default"
          trend={{
            current: secondHalfCompleted + secondHalfFailed,
            previous: firstHalfCompleted + firstHalfFailed,
            higherIsBetter: true,
          }}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <SummaryCard
          title="Error Rate"
          value={formatPercentage(summary.errorRate)}
          subtitle={`${summary.totalFailed} failed`}
          sparklineData={errorSparkline}
          sparklineColor={summary.errorRate > 0.1 ? "danger" : "success"}
          trend={{
            current: secondHalfFailed,
            previous: firstHalfFailed,
            higherIsBetter: false,
          }}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <SummaryCard
          title="Avg Duration"
          value={formatDuration(summary.avgDuration)}
          subtitle="processing time"
          sparklineData={durationSparkline}
          sparklineColor="default"
          icon={<Zap className="h-4 w-4" />}
        />
        <SummaryCard
          title="Avg Wait Time"
          value={formatDuration(summary.avgWaitTime)}
          subtitle="queue delay"
          sparklineData={waitTimeSparkline}
          sparklineColor={summary.avgWaitTime > 60000 ? "warning" : "default"}
          icon={<Hourglass className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Throughput Chart */}
        <div className="border border-dashed bg-card p-4">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Job Throughput
          </h3>
          <ChartContainer
            config={throughputChartConfig}
            className="h-52 w-full"
          >
            <AreaChart data={throughputData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHourShort}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value}
                  </span>
                )}
              />
              <defs>
                <linearGradient
                  id="completedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--color-completed)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-completed)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                {/* Diagonal hatching pattern for failed jobs */}
                <pattern
                  id="failedPattern"
                  x="0"
                  y="0"
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    width="6"
                    height="6"
                    fill="var(--color-failed)"
                    fillOpacity={0.15}
                  />
                  <path
                    d="M0,0 L6,6 M-1,5 L5,11 M-1,-1 L7,7"
                    stroke="var(--color-failed)"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </pattern>
              </defs>
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stackId="1"
                stroke="var(--color-completed)"
                fill="url(#completedGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--color-completed)",
                  stroke: "none",
                }}
              />
              <Area
                type="monotone"
                dataKey="failed"
                name="Failed"
                stackId="1"
                stroke="var(--color-failed)"
                fill="url(#failedPattern)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--color-failed)",
                  stroke: "none",
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Duration Chart */}
        <div className="border border-dashed bg-card p-4">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Processing Time
          </h3>
          <ChartContainer config={durationChartConfig} className="h-52 w-full">
            <BarChart data={durationData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHourShort}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatDuration(v)}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<DurationTooltip />} cursor={false} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="duration"
                name="Duration"
                fill="hsl(210, 90%, 50%)"
                radius={[0, 0, 0, 0]}
                style={{ outline: "none" }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="waitTime"
                name="Wait Time"
                fill="hsl(45, 95%, 50%)"
                radius={[0, 0, 0, 0]}
                style={{ outline: "none" }}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Problem Tables */}
      <div className="grid grid-cols-2 gap-4">
        {/* Slowest Jobs */}
        <div className="border border-dashed bg-card">
          <div className="border-b border-dashed px-4 py-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Slowest Jobs
            </h3>
          </div>
          <SlowestJobsTable jobs={slowestJobs} />
        </div>

        {/* Most Failing */}
        <div className="border border-dashed bg-card">
          <div className="border-b border-dashed px-4 py-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Most Failing Job Types
            </h3>
          </div>
          <FailingJobsTable jobs={mostFailingTypes} />
        </div>
      </div>
    </div>
  );
}
