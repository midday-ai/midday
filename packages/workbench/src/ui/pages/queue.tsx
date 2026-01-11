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
  queryKeys,
  useBulkDelete,
  useBulkPromote,
  useBulkRetry,
  useJobs,
  usePauseQueue,
  useQueues,
  useResumeQueue,
} from "@/lib/hooks";
import { cn, truncate } from "@/lib/utils";
import type { QueueSearch } from "@/router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileText, Pause, Play, RefreshCw } from "lucide-react";
import * as React from "react";

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
  const queryClient = useQueryClient();

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

  const total = data?.pages[0]?.total ?? 0;

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.jobs(queueName, statusFilter, search.sort),
    });
  };

  const handleStatusChange = (status: string) => {
    onSearchChange({
      ...search,
      status: status as QueueSearch["status"],
    });
  };

  const loading = isLoading || isRefetching;

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

          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Jobs Table */}
      {isLoading && jobs.length === 0 ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i.toString()}
              className="h-16 animate-pulse border bg-card"
            />
          ))}
        </div>
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
          <div className="grid grid-cols-12 gap-4 border-b px-4 py-2 text-xs uppercase tracking-wider">
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
          <div className="space-y-1">
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
            <span>
              Showing {jobs.length} of {total} jobs
            </span>
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
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      role="button"
      tabIndex={0}
      className={cn(
        "grid w-full grid-cols-12 items-center gap-4 border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent cursor-pointer",
        selected && "bg-muted/30",
      )}
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
    </div>
  );
}
