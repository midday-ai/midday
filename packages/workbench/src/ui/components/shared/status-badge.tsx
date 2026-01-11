import type { JobStatus } from "@/core/types";
import { cn, formatDuration } from "@/lib/utils";

interface StatusBadgeProps {
  status: JobStatus;
  duration?: number;
  className?: string;
}

const statusConfig: Record<
  JobStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  completed: {
    label: "Completed",
    dotClass: "bg-[hsl(var(--status-success))]",
    textClass: "text-[hsl(var(--status-success))]",
    bgClass: "bg-[hsl(var(--status-success))]/10",
  },
  active: {
    label: "Running",
    dotClass: "bg-[hsl(var(--status-active))]",
    textClass: "text-[hsl(var(--status-active))]",
    bgClass: "bg-[hsl(var(--status-active))]/10",
  },
  waiting: {
    label: "Queued",
    dotClass: "bg-[hsl(var(--status-pending))]",
    textClass: "text-[hsl(var(--status-pending))]",
    bgClass: "bg-[hsl(var(--status-pending))]/10",
  },
  delayed: {
    label: "Delayed",
    dotClass: "bg-[hsl(var(--status-warning))]",
    textClass: "text-[hsl(var(--status-warning))]",
    bgClass: "bg-[hsl(var(--status-warning))]/10",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-[hsl(var(--status-error))]",
    textClass: "text-[hsl(var(--status-error))]",
    bgClass: "bg-[hsl(var(--status-error))]/10",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-[hsl(var(--status-pending))]",
    textClass: "text-[hsl(var(--status-pending))]",
    bgClass: "bg-[hsl(var(--status-pending))]/10",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-[hsl(var(--status-pending))]",
    textClass: "text-[hsl(var(--status-pending))]",
    bgClass: "bg-[hsl(var(--status-pending))]/10",
  },
};

export function StatusBadge({ status, duration, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        config.bgClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      <span className={config.textClass}>{config.label}</span>
    </span>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const config = statusConfig[status] || statusConfig.unknown;
  return (
    <span className={cn("h-2 w-2 rounded-full", config.dotClass, className)} />
  );
}

export function StatusText({
  status,
  duration,
  className,
}: {
  status: JobStatus;
  duration?: number;
  className?: string;
}) {
  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
      <span className={cn("text-sm", config.textClass)}>{config.label}</span>
      {duration !== undefined && (
        <span className="text-sm text-muted-foreground">
          {formatDuration(duration)}
        </span>
      )}
    </span>
  );
}
