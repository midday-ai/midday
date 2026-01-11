import type { FlowNode as FlowNodeType } from "@/core/types";
import { cn } from "@/lib/utils";
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
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  active: {
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    animate: true,
  },
  waiting: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
  },
  delayed: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  paused: {
    icon: Pause,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
  },
  unknown: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
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
        "relative min-w-[180px] rounded-lg border px-3 py-2.5 shadow-md transition-all",
        "hover:shadow-lg cursor-pointer",
        "bg-card text-card-foreground",
        config.border
      )}
      onClick={() => onClick?.(flowNode)}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/50 !border-2 !border-background"
      />

      {/* Content */}
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "p-1.5 rounded-md shrink-0",
            config.bg
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              config.color,
              config.animate && "animate-spin"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate text-foreground">
            {job.name}
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {queueName}
          </div>
          {job.duration !== undefined && (
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {formatDuration(job.duration)}
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          "absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
          "bg-background border shadow-sm",
          config.color,
          config.border
        )}
      >
        {job.status}
      </div>

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/50 !border-2 !border-background"
      />
    </div>
  );
}

export const FlowNodeMemo = memo(FlowNodeComponent);
