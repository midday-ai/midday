import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Network,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusBadge } from "@/components/shared/status-badge";
import type { FlowSummary } from "@/core/types";
import { useFlows } from "@/lib/hooks";

interface FlowsPageProps {
  onFlowSelect: (queueName: string, jobId: string) => void;
}

export function FlowsPage({ onFlowSelect }: FlowsPageProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFlows();

  const handleQueueClick = (queueName: string) => {
    navigate({ to: "/queues/$queueName", params: { queueName } });
  };

  const flows = data?.flows || [];

  // Loading skeleton
  if (isLoading && flows.length === 0) {
    return (
      <div className="divide-y divide-border/50">
        {[...Array(12)].map((_, i) => (
          <div
            key={i.toString()}
            className="grid grid-cols-12 items-center gap-4 py-3"
          >
            <div className="col-span-4 flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="col-span-2">
              <div className="h-5 w-20 animate-pulse bg-muted" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load flows"
          description={(error as Error).message}
        />
      </div>
    );
  }

  // Empty state
  if (flows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <EmptyState
          icon={Network}
          title="No flows found"
          description="Flows are created when you use BullMQ's FlowProducer"
        />
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="grid grid-cols-12 gap-4 border-b border-dashed py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Flow</div>
          <div className="col-span-2">Queue</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Progress</div>
          <div className="col-span-2">Created</div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border/50">
        {flows.map((flow) => (
          <FlowRow
            key={`${flow.queueName}:${flow.id}`}
            flow={flow}
            onClick={() => onFlowSelect(flow.queueName, flow.id)}
            onQueueClick={handleQueueClick}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="py-2.5 text-[11px] text-muted-foreground border-t border-dashed">
        {flows.length} flow{flows.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

interface FlowRowProps {
  flow: FlowSummary;
  onClick: () => void;
  onQueueClick: (queueName: string) => void;
}

function FlowRow({ flow, onClick, onQueueClick }: FlowRowProps) {
  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQueueClick(flow.queueName);
  };

  return (
    <div
      onClick={onClick}
      className="group grid w-full grid-cols-12 items-center gap-4 py-3 text-left text-sm cursor-default"
    >
      {/* Flow name */}
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <Network className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="truncate font-medium text-sm">{flow.name}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">
            {flow.id}
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="col-span-2">
        <button
          type="button"
          onClick={handleQueueClick}
          className="truncate font-mono text-[11px] text-primary hover:underline"
        >
          {flow.queueName}
        </button>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <StatusBadge status={flow.status} />
      </div>

      {/* Progress */}
      <div className="col-span-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground tabular-nums">
              {flow.completedJobs}
            </span>
          </div>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground tabular-nums">
            {flow.totalJobs}
          </span>
          {flow.failedJobs > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive tabular-nums">
                {flow.failedJobs}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Created */}
      <div className="col-span-2 flex items-center justify-between">
        <RelativeTime timestamp={flow.timestamp} />
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}
