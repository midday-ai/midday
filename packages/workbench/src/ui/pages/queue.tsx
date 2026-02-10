import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileText, Pause, Play, RefreshCw } from "lucide-react";
import * as React from "react";
import {
  BulkBottomBar,
  type BulkSelection,
} from "@/components/shared/bulk-bottom-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { SortableHeader, useSort } from "@/components/shared/sortable-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobInfo, JobStatus } from "@/core/types";
import {
  useBulkDelete,
  useBulkPromote,
  useBulkRetry,
  useJobs,
  usePauseQueue,
  useQueues,
  useRefresh,
  useResumeQueue,
} from "@/lib/hooks";
import { truncate } from "@/lib/utils";
import type { QueueSearch } from "@/router";

interface QueuePageProps {
  queueName: string;
  search: QueueSearch;
  onSearchChange: (search: QueueSearch) => void;
  onJobSelect: (jobId: string) => void;
}

const statusTabs: { value: JobStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "delayed", label: "Delayed" },
];

export function QueuePage({
  queueName,
  search,
  onSearchChange,
  onJobSelect,
}: QueuePageProps) {
  const _queryClient = useQueryClient();

  // Selection state for bulk actions
  const [selection, setSelection] = React.useState<Map<string, BulkSelection>>(
    new Map(),
  );

  // Get queue info for pause state
  const { data: queues = [] } = useQueues();
  const queueInfo = queues.find((q) => q.name === queueName);
  const isPaused = queueInfo?.isPaused ?? false;

  // Pause/Resume mutations
  const pauseQueue = usePauseQueue();
  const resumeQueue = useResumeQueue();
  const isPauseLoading = pauseQueue.isPending || resumeQueue.isPending;

  const handleTogglePause = () => {
    if (isPaused) {
      resumeQueue.mutate(queueName);
    } else {
      pauseQueue.mutate(queueName);
    }
  };

  // Bulk action mutations
  const bulkRetry = useBulkRetry();
  const bulkDelete = useBulkDelete();
  const bulkPromote = useBulkPromote();

  // Parse status and sort from URL
  const statusFilter =
    search.status === "all" ? undefined : (search.status as JobStatus);

  // Sort hook
  const { currentSort, handleSort } = useSort(search.sort, (sort) =>
    onSearchChange({ ...search, sort }),
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useJobs(queueName, statusFilter, search.sort);

  // Flatten all pages into a single array
  const jobs = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const _total = data?.pages[0]?.total ?? 0;

  // Server-side cache refresh
  const refreshMutation = useRefresh();

  const _refresh = () => {
    refreshMutation.mutate();
  };

  const handleStatusChange = (status: string) => {
    onSearchChange({
      ...search,
      status: status as QueueSearch["status"],
    });
  };

  const _loading = isLoading || isRefetching || refreshMutation.isPending;

  // Selection helpers
  const isSelected = (jobId: string) => selection.has(jobId);

  const toggleSelection = (job: JobInfo) => {
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(job.id)) {
        next.delete(job.id);
      } else {
        next.set(job.id, { queueName, jobId: job.id, status: job.status });
      }
      return next;
    });
  };

  const selectAll = () => {
    const newSelection = new Map<string, BulkSelection>();
    for (const job of jobs) {
      newSelection.set(job.id, {
        queueName,
        jobId: job.id,
        status: job.status,
      });
    }
    setSelection(newSelection);
  };

  const clearSelection = () => setSelection(new Map());

  const isAllSelected = jobs.length > 0 && selection.size === jobs.length;
  const isPartiallySelected =
    selection.size > 0 && selection.size < jobs.length;

  // Bulk action handlers - only act on relevant job statuses
  const handleBulkRetry = async () => {
    const failedJobs = Array.from(selection.values()).filter(
      (s) => s.status === "failed",
    );
    if (failedJobs.length > 0) {
      await bulkRetry.mutateAsync({ jobs: failedJobs });
    }
    clearSelection();
  };

  const handleBulkDelete = async () => {
    const jobsList = Array.from(selection.values());
    await bulkDelete.mutateAsync({ jobs: jobsList });
    clearSelection();
  };

  const handleBulkPromote = async () => {
    const delayedJobs = Array.from(selection.values()).filter(
      (s) => s.status === "delayed",
    );
    if (delayedJobs.length > 0) {
      await bulkPromote.mutateAsync({ jobs: delayedJobs });
    }
    clearSelection();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tabs
            value={search.status || "all"}
            onValueChange={handleStatusChange}
          >
            <TabsList>
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isPaused && (
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-600"
            >
              Paused
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            onClick={handleTogglePause}
            disabled={isPauseLoading}
          >
            {isPaused ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Jobs Table */}
      {isLoading && jobs.length === 0 ? (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-dashed py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Job</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Queued</div>
            <div className="col-span-2">Started</div>
            <div className="col-span-1" />
          </div>
          {/* Skeleton Rows */}
          <div className="divide-y divide-border/50">
            {[...Array(15)].map((_, i) => (
              <div
                key={i.toString()}
                className="grid grid-cols-12 items-center gap-4 py-3"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="h-5 w-20 animate-pulse bg-muted" />
                </div>
                <div className="col-span-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="col-span-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="col-span-1 flex justify-end">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : error ? (
        <EmptyState
          icon={FileText}
          title="Failed to load jobs"
          description={error.message}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No jobs found"
          description={
            statusFilter
              ? `No ${statusFilter} jobs in this queue`
              : "This queue is empty"
          }
        />
      ) : (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-dashed py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5 flex items-center gap-3">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isPartiallySelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAll();
                  } else {
                    clearSelection();
                  }
                }}
              />
              <SortableHeader
                field="name"
                label="Job"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2">
              <SortableHeader
                field="status"
                label="Status"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2">
              <SortableHeader
                field="timestamp"
                label="Queued"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2">
              <SortableHeader
                field="processedOn"
                label="Started"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-1" />
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/50">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                selected={isSelected(job.id)}
                onSelect={() => toggleSelection(job)}
                onClick={() => onJobSelect(job.id)}
              />
            ))}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <span>Showing {jobs.length} jobs</span>
          </div>
        </>
      )}

      {/* Bulk Actions Bottom Bar */}
      <BulkBottomBar
        selection={Array.from(selection.values())}
        onClear={clearSelection}
        onRetry={handleBulkRetry}
        onDelete={handleBulkDelete}
        onPromote={handleBulkPromote}
        isRetrying={bulkRetry.isPending}
        isDeleting={bulkDelete.isPending}
        isPromoting={bulkPromote.isPending}
      />
    </div>
  );
}

interface JobRowProps {
  job: JobInfo;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

function JobRow({ job, selected, onSelect, onClick }: JobRowProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-12 items-center gap-4 py-3 text-left text-sm cursor-default"
    >
      <div className="col-span-5 flex min-w-0 items-center gap-3">
        <div
          onClick={handleCheckboxClick}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Checkbox checked={selected} />
        </div>
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="truncate font-medium">{job.name}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {truncate(job.id, 24)}
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <StatusBadge status={job.status} duration={job.duration} />
      </div>
      <div className="col-span-2 text-muted-foreground">
        <RelativeTime timestamp={job.timestamp} />
      </div>
      <div className="col-span-2 text-muted-foreground">
        {job.processedOn ? (
          <RelativeTime timestamp={job.processedOn} />
        ) : (
          <span>-</span>
        )}
      </div>
      <div className="col-span-1 flex justify-end">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}
