import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
  color?: "default" | "success" | "danger" | "warning";
}

/**
 * Simple sparkline chart using SVG
 */
function Sparkline({ data, className, color = "default" }: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const width = 80;
  const height = 24;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Create gradient area
  const areaPoints = [`0,${height}`, ...points, `${width},${height}`].join(" ");

  const colorClass = {
    default: "text-chart-1",
    success: "text-chart-success",
    danger: "text-chart-error",
    warning: "text-chart-4",
  }[color];

  const patternId = `sparkline-${color}-pattern`;
  const fillColorClass = {
    default: "fill-chart-1",
    success: "fill-chart-success",
    danger: "fill-chart-error",
    warning: "fill-chart-4",
  }[color];

  const strokeColorClass = {
    default: "stroke-chart-1",
    success: "stroke-chart-success",
    danger: "stroke-chart-error",
    warning: "stroke-chart-4",
  }[color];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-20 h-6", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="4"
            height="4"
            className={cn(fillColorClass, "opacity-15")}
          />
          <path
            d="M0,0 L4,4 M-1,3 L3,7 M-1,-1 L5,5"
            className={strokeColorClass}
            strokeWidth="0.75"
            opacity="0.4"
          />
        </pattern>
      </defs>
      <polygon points={areaPoints} fill={`url(#${patternId})`} />
      <path
        d={pathD}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("stroke-current", colorClass)}
      />
    </svg>
  );
}

interface TrendBadgeProps {
  current: number;
  previous: number;
  higherIsBetter?: boolean;
}

/**
 * Shows trend compared to previous period
 */
function TrendBadge({
  current,
  previous,
  higherIsBetter = true,
}: TrendBadgeProps) {
  if (previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const isUp = change > 0;
  const isNeutral = Math.abs(change) < 1;
  const isGood = higherIsBetter ? isUp : !isUp;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Minus className="h-3 w-3 mr-0.5" />
        0%
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium",
        isGood ? "text-chart-success" : "text-chart-error",
      )}
    >
      {isUp ? (
        <ArrowUp className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDown className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  sparklineData?: number[];
  sparklineColor?: "default" | "success" | "danger" | "warning";
  trend?: {
    current: number;
    previous: number;
    higherIsBetter?: boolean;
  };
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Summary card with value, sparkline, and optional trend
 */
export function SummaryCard({
  title,
  value,
  subtitle,
  sparklineData,
  sparklineColor = "default",
  trend,
  className,
  icon,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "border border-dashed bg-card p-4 flex flex-col gap-2",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {trend && (
            <TrendBadge
              current={trend.current}
              previous={trend.previous}
              higherIsBetter={trend.higherIsBetter}
            />
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} color={sparklineColor} />
        )}
      </div>
    </div>
  );
}
