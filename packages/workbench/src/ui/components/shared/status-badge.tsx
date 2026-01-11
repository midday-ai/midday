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
    dotClass: "bg-status-success",
    textClass: "text-status-success",
    bgClass: "bg-status-success/10",
  },
  active: {
    label: "Running",
    dotClass: "bg-status-active",
    textClass: "text-status-active",
    bgClass: "bg-status-active/10",
  },
  waiting: {
    label: "Queued",
    dotClass: "bg-status-pending",
    textClass: "text-status-pending",
    bgClass: "bg-status-pending/10",
  },
  delayed: {
    label: "Delayed",
    dotClass: "bg-status-warning",
    textClass: "text-status-warning",
    bgClass: "bg-status-warning/10",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-status-error",
    textClass: "text-status-error",
    bgClass: "bg-status-error/10",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-status-pending",
    textClass: "text-status-pending",
    bgClass: "bg-status-pending/10",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-status-pending",
    textClass: "text-status-pending",
    bgClass: "bg-status-pending/10",
  },
};

export function StatusBadge({ status, duration, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium",
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
