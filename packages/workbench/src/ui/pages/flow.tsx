import type { FlowNode } from "@/core/types";
import { FlowGraph } from "@/components/flows";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useFlow } from "@/lib/hooks";
import { cn, formatDuration } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GitBranch,
  Loader2,
  Network,
  XCircle,
} from "lucide-react";

interface FlowPageProps {
  queueName: string;
  jobId: string;
}

export function FlowPage({ queueName, jobId }: FlowPageProps) {
  const navigate = useNavigate();
  const { data: flow, isLoading, error } = useFlow(queueName, jobId);

  const handleNodeClick = (node: FlowNode) => {
    navigate({
      to: "/queues/$queueName/jobs/$jobId",
      params: { queueName: node.queueName, jobId: node.job.id },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-6 px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        {/* Graph skeleton */}
        <div className="rounded-lg border bg-card h-[500px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !flow) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load flow"
        description={(error as Error)?.message || "Flow not found or jobs have been cleaned up"}
      />
    );
  }

  // Count stats from flow tree
  const stats = countFlowStats(flow);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded-lg border bg-card">
        {/* Title row */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Network className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{flow.job.name}</h2>
            <StatusBadge status={flow.job.status} />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Queue:</span>
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/queues/$queueName",
                  params: { queueName },
                })
              }
              className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary hover:underline"
            >
              {queueName}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {stats.total} job{stats.total !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">{stats.completed} completed</span>
          </div>
          {stats.failed > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-500">{stats.failed} failed</span>
            </div>
          )}
          {flow.job.duration !== undefined && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatDuration(flow.job.duration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Flow Graph Card */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="h-[600px]">
          <FlowGraph flow={flow} onNodeClick={handleNodeClick} />
        </div>
      </div>
    </div>
  );
}

function countFlowStats(node: FlowNode): {
  total: number;
  completed: number;
  failed: number;
} {
  let total = 1;
  let completed = node.job.status === "completed" ? 1 : 0;
  let failed = node.job.status === "failed" ? 1 : 0;

  if (node.children) {
    for (const child of node.children) {
      const childStats = countFlowStats(child);
      total += childStats.total;
      completed += childStats.completed;
      failed += childStats.failed;
    }
  }

  return { total, completed, failed };
}
