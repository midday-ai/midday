import { Handle, Position } from "@xyflow/react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Pause,
  XCircle,
} from "lucide-react";
import { memo } from "react";
import type { FlowNode as FlowNodeType } from "@/core/types";
import { cn } from "@/lib/utils";

export interface FlowNodeData extends Record<string, unknown> {
  flowNode: FlowNodeType;
  onClick?: (flowNode: FlowNodeType) => void;
}

interface FlowNodeProps {
  data: FlowNodeData;
}

const statusConfig: Record<
  string,
  {
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    border: string;
    animate?: boolean;
  }
> = {
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  active: {
    icon: Loader2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/20",
    animate: true,
  },
  waiting: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
  delayed: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
  },
  failed: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-200 dark:border-red-500/20",
  },
  paused: {
    icon: Pause,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
  unknown: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function FlowNodeComponent({ data }: FlowNodeProps) {
  const { flowNode, onClick } = data;
  const { job, queueName } = flowNode;

  const config = statusConfig[job.status] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative min-w-[180px] px-3 py-2.5 transition-all",
        "hover:bg-accent/50 cursor-pointer",
        "bg-background border",
        config.border,
      )}
      onClick={() => onClick?.(flowNode)}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-muted-foreground/40 !border-0"
      />

      {/* Content */}
      <div className="flex items-start gap-2.5">
        <div className={cn("p-1.5 shrink-0", config.bg)}>
          <Icon
            className={cn(
              "h-3.5 w-3.5",
              config.color,
              config.animate && "animate-spin",
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate text-foreground">
            {job.name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {queueName}
          </div>
          {job.duration !== undefined && (
            <div className="text-[11px] text-muted-foreground mt-1 font-mono tabular-nums">
              {formatDuration(job.duration)}
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          "absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
          "bg-background border",
          config.color,
          config.border,
        )}
      >
        {job.status}
      </div>

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-muted-foreground/40 !border-0"
      />
    </div>
  );
}

export const FlowNodeMemo = memo(FlowNodeComponent);
