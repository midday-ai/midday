import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileText, RefreshCw, X } from "lucide-react";
import * as React from "react";
import {
  BulkBottomBar,
  type BulkSelection,
} from "@/components/shared/bulk-bottom-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { SortableHeader, useSort } from "@/components/shared/sortable-header";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { parseSearchQuery, SmartSearch } from "@/components/smart-search";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { JobStatus, RunInfoList } from "@/core/types";
import {
  useActivityStats,
  useBulkDelete,
  useBulkPromote,
  useBulkRetry,
  useRefresh,
  useRuns,
} from "@/lib/hooks";
import { formatDuration, truncate } from "@/lib/utils";
import type { RunsSearch } from "@/router";

interface RunsPageProps {
  search: RunsSearch;
  onSearchChange: (search: RunsSearch) => void;
  onJobSelect: (queueName: string, jobId: string) => void;
  onQueueSelect: (queueName: string) => void;
}

export function RunsPage({
  search,
  onSearchChange,
  onJobSelect,
  onQueueSelect,
}: RunsPageProps) {
  const _queryClient = useQueryClient();

  // Selection state for bulk actions
  const [selection, setSelection] = React.useState<Map<string, BulkSelection>>(
    new Map(),
  );

  // Bulk action mutations
  const bulkRetry = useBulkRetry();
  const bulkDelete = useBulkDelete();
  const bulkPromote = useBulkPromote();

  // Sort hook
  const { currentSort, handleSort } = useSort(search.sort, (sort) =>
    onSearchChange({ ...search, sort }),
  );

  // Parse tag filters from the q param
  const parsedQuery = React.useMemo(
    () => parseSearchQuery(search.q ?? ""),
    [search.q],
  );

  // Derive time range from URL params
  const timeRange = React.useMemo<
    { start: number; end: number } | undefined
  >(() => {
    if (search.from && search.to) {
      return { start: search.from, end: search.to };
    }
    return undefined;
  }, [search.from, search.to]);

  // Build filters object for server-side filtering
  const filters = React.useMemo(() => {
    const statusFilter = search.status ?? "all";
    const hasFilters =
      statusFilter !== "all" ||
      Object.keys(parsedQuery.tags).length > 0 ||
      !!parsedQuery.text ||
      !!timeRange;

    if (!hasFilters) {
      return undefined;
    }

    return {
      status: statusFilter !== "all" ? (statusFilter as JobStatus) : undefined,
      tags:
        Object.keys(parsedQuery.tags).length > 0 ? parsedQuery.tags : undefined,
      text: parsedQuery.text || undefined,
      timeRange,
    };
  }, [search.status, parsedQuery, timeRange]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useRuns(search.sort, filters);

  // Flatten all pages into a single array (already filtered server-side)
  const runs = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  // No client-side filtering needed - server handles it
  const filteredRuns = runs;

  // Handle search change
  const handleSearchChange = (q: string, status?: string) => {
    onSearchChange({
      ...search,
      q: q || undefined,
      status: (status as RunsSearch["status"]) ?? search.status,
    });
  };

  // Handle timeline selection
  const handleTimeRangeChange = (
    range: { start: number; end: number } | null,
  ) => {
    onSearchChange({
      ...search,
      from: range?.start,
      to: range?.end,
    });
  };

  // Server-side cache refresh
  const refreshMutation = useRefresh();

  const _refresh = () => {
    refreshMutation.mutate();
  };

  const _loading = isLoading || isRefetching || refreshMutation.isPending;

  // Selection helpers
  const selectionKey = (queueName: string, jobId: string) =>
    `${queueName}:${jobId}`;

  const isSelected = (queueName: string, jobId: string) =>
    selection.has(selectionKey(queueName, jobId));

  const toggleSelection = (run: RunInfoList) => {
    const key = selectionKey(run.queueName, run.id);
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          queueName: run.queueName,
          jobId: run.id,
          status: run.status,
        });
      }
      return next;
    });
  };

  const selectAll = () => {
    const newSelection = new Map<string, BulkSelection>();
    for (const run of filteredRuns) {
      const key = selectionKey(run.queueName, run.id);
      newSelection.set(key, {
        queueName: run.queueName,
        jobId: run.id,
        status: run.status,
      });
    }
    setSelection(newSelection);
  };

  const clearSelection = () => setSelection(new Map());

  const isAllSelected =
    filteredRuns.length > 0 && selection.size === filteredRuns.length;
  const isPartiallySelected =
    selection.size > 0 && selection.size < filteredRuns.length;

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
    const jobs = Array.from(selection.values());
    await bulkDelete.mutateAsync({ jobs });
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

  // Fetch activity stats from API (cached server-side, complete 7-day data)
  const { data: activityData } = useActivityStats();

  // Transform API data into timeline format
  const timelineData = React.useMemo(() => {
    if (!activityData) {
      // Return empty placeholder while loading
      const now = Date.now();
      const bucketSize = 4 * 60 * 60 * 1000;
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 6);
      return {
        buckets: [] as {
          time: number;
          label: string;
          dayLabel: string;
          success: number;
          error: number;
        }[],
        startTime: startDate.getTime(),
        endTime: now,
        bucketSize,
      };
    }

    const buckets = activityData.buckets.map((bucket) => {
      const date = new Date(bucket.time);
      return {
        time: bucket.time,
        label: date.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
        }),
        dayLabel: date.toLocaleDateString([], { weekday: "short" }),
        success: bucket.completed,
        error: bucket.failed,
      };
    });

    return {
      buckets,
      startTime: activityData.startTime,
      endTime: activityData.endTime,
      bucketSize: activityData.bucketSize,
    };
  }, [activityData]);

  const totalSuccess = activityData?.totalCompleted ?? 0;
  const totalError = activityData?.totalFailed ?? 0;

  // Infinite scroll - load more when sentinel is visible
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="h-full overflow-auto">
      {/* Activity Timeline - scrolls with content */}
      <div className="py-4">
        <ActivityTimeline
          data={timelineData}
          selection={timeRange ?? null}
          onSelectionChange={handleTimeRangeChange}
          totalSuccess={totalSuccess}
          totalError={totalError}
        />
      </div>

      {/* Sticky header section - Search and Table Header */}
      <div className="sticky top-0 z-20 bg-background">
        {/* Smart Search */}
        <div className="border-b border-dashed pb-3">
          <SmartSearch
            value={search.q ?? ""}
            status={search.status}
            onChange={handleSearchChange}
          />
        </div>

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
              field="queueName"
              label="Queue"
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
              label="Time"
              currentSort={currentSort}
              onSort={handleSort}
            />
          </div>
          <div className="col-span-1">
            <SortableHeader
              field="duration"
              label="Duration"
              currentSort={currentSort}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>

      {/* Table content */}
      {isLoading && runs.length === 0 ? (
        <div className="divide-y divide-border/50">
          {[...Array(15)].map((_, i) => (
            <div
              key={i.toString()}
              className="grid grid-cols-12 items-center gap-4 py-3"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="h-4 w-4 animate-pulse bg-muted" />
                <div className="h-2 w-2 animate-pulse bg-muted" />
                <div className="h-4 w-32 animate-pulse bg-muted" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-16 animate-pulse bg-muted" />
              </div>
              <div className="col-span-2">
                <div className="h-5 w-20 animate-pulse bg-muted" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-24 animate-pulse bg-muted" />
              </div>
              <div className="col-span-1">
                <div className="h-4 w-12 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <EmptyState
            icon={FileText}
            title="Failed to load runs"
            description={error.message}
          />
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <EmptyState
            icon={FileText}
            title="No runs found"
            description={
              parsedQuery.text
                ? `No results for "${parsedQuery.text}"`
                : search.status && search.status !== "all"
                  ? `No ${search.status} runs`
                  : "No job runs yet"
            }
          />
        </div>
      ) : (
        <>
          {/* Table Rows */}
          <div className="divide-y divide-border/50">
            {filteredRuns.map((run) => (
              <RunRow
                key={`${run.queueName}-${run.id}`}
                run={run}
                selected={isSelected(run.queueName, run.id)}
                onSelect={() => toggleSelection(run)}
                onClick={() => onJobSelect(run.queueName, run.id)}
                onQueueClick={onQueueSelect}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-4"
            >
              {isFetchingNextPage && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 text-xs text-muted-foreground">
            Showing {filteredRuns.length} runs
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

interface RunRowProps {
  run: RunInfoList;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onQueueClick: (queueName: string) => void;
}

function RunRow({
  run,
  selected,
  onSelect,
  onClick,
  onQueueClick,
}: RunRowProps) {
  const hasTags = run.tags && Object.keys(run.tags).length > 0;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQueueClick(run.queueName);
  };

  return (
    <div
      className="group grid w-full grid-cols-12 items-center gap-4 py-3 text-left text-sm cursor-pointer"
      onClick={onClick}
    >
      <div className="col-span-5 flex min-w-0 items-center gap-3">
        <div
          onClick={handleCheckboxClick}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Checkbox checked={selected} />
        </div>
        <StatusDot status={run.status} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{run.name}</span>
            {hasTags && (
              <div className="flex items-center gap-1">
                {Object.entries(run.tags!)
                  .slice(0, 2)
                  .map(([key, val]) => (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {key}:{truncate(String(val), 8)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="font-mono">
                          {key}: {String(val)}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                {Object.keys(run.tags!).length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{Object.keys(run.tags!).length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {truncate(run.id, 24)}
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <button
          type="button"
          onClick={handleQueueClick}
          className="truncate font-mono text-xs text-primary hover:underline"
        >
          {run.queueName}
        </button>
      </div>
      <div className="col-span-2">
        <StatusBadge status={run.status} />
      </div>
      <div className="col-span-2 text-muted-foreground">
        {run.processedOn ? (
          <RelativeTime timestamp={run.processedOn} />
        ) : (
          <RelativeTime timestamp={run.timestamp} />
        )}
      </div>
      <div className="col-span-1 flex items-center justify-between">
        <span className="font-mono text-muted-foreground">
          {run.duration ? formatDuration(run.duration) : "-"}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}

// Activity Timeline with brush selection
interface TimelineData {
  buckets: {
    time: number;
    label: string;
    dayLabel: string;
    success: number;
    error: number;
  }[];
  startTime: number;
  endTime: number;
  bucketSize: number;
}

interface ActivityTimelineProps {
  data: TimelineData;
  selection: { start: number; end: number } | null;
  onSelectionChange: (range: { start: number; end: number } | null) => void;
  totalSuccess: number;
  totalError: number;
}

function ActivityTimeline({
  data,
  selection,
  onSelectionChange,
  totalSuccess,
  totalError,
}: ActivityTimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<number | null>(null);
  const [dragEnd, setDragEnd] = React.useState<number | null>(null);

  const maxValue = Math.max(...data.buckets.map((b) => b.success + b.error), 1);

  const getTimeFromPosition = (clientX: number) => {
    if (!containerRef.current) return data.startTime;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    return data.startTime + ratio * (data.endTime - data.startTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const time = getTimeFromPosition(e.clientX);
    setIsDragging(true);
    setDragStart(time);
    setDragEnd(time);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return;
    const time = getTimeFromPosition(e.clientX);
    setDragEnd(time);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      // Only set selection if dragged more than 1 second
      if (end - start > 1000) {
        onSelectionChange({ start, end });
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  const formatDayLabel = (time: number) => {
    const date = new Date(time);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return "Today";
    return date.toLocaleDateString([], { weekday: "short" });
  };

  // Calculate selection position for overlay
  const getSelectionStyle = (range: { start: number; end: number }) => {
    const duration = data.endTime - data.startTime;
    const left = ((range.start - data.startTime) / duration) * 100;
    const width = ((range.end - range.start) / duration) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="border border-dashed p-4">
      {/* Header with stats */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Activity
          </span>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-chart-1" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {totalSuccess} completed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-chart-failed" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {totalError} failed
            </span>
          </div>
          <div className="h-6">
            {selection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange(null)}
                className="h-6 gap-1 px-2 text-xs"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chart area - 7 day flow with granular bars */}
      <div
        ref={containerRef}
        className="relative h-12 cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Bars */}
        {data.buckets.map((bucket, i) => {
          const total = bucket.success + bucket.error;
          const successHeight =
            bucket.success > 0
              ? Math.max((bucket.success / maxValue) * 100, 8)
              : 0;
          const errorHeight =
            bucket.error > 0 ? Math.max((bucket.error / maxValue) * 100, 8) : 0;
          const hasActivity = total > 0;

          // Calculate position based on bucket time
          const timeRange = data.endTime - data.startTime;
          const bucketPosition =
            ((bucket.time - data.startTime) / timeRange) * 100;

          return (
            <Tooltip key={i.toString()}>
              <TooltipTrigger asChild>
                <div
                  className="absolute bottom-0 flex h-full w-[3px] flex-col justify-end"
                  style={{ left: `${bucketPosition}%` }}
                >
                  {hasActivity ? (
                    <>
                      {bucket.error > 0 && (
                        <div
                          className="w-full bg-chart-failed"
                          style={{ height: `${errorHeight}%` }}
                        />
                      )}
                      {bucket.success > 0 && (
                        <div
                          className="w-full bg-chart-1"
                          style={{ height: `${successHeight}%` }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="h-px w-full bg-muted/30" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="font-medium text-foreground">
                  {bucket.label}
                </div>
                {total > 0 ? (
                  <>
                    <div className="text-muted-foreground">
                      {total} {total === 1 ? "run" : "runs"}
                    </div>
                    {bucket.success > 0 && (
                      <div className="text-chart-1">
                        {bucket.success} completed
                      </div>
                    )}
                    {bucket.error > 0 && (
                      <div className="text-chart-failed">
                        {bucket.error} failed
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground">No activity</div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Baseline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />

        {/* Drag selection overlay */}
        {isDragging && dragStart !== null && dragEnd !== null && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 border-x border-ring bg-ring/10"
            style={getSelectionStyle({
              start: Math.min(dragStart, dragEnd),
              end: Math.max(dragStart, dragEnd),
            })}
          />
        )}

        {/* Active selection overlay */}
        {selection && !isDragging && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 border-x-2 border-ring bg-ring/20"
            style={getSelectionStyle(selection)}
          />
        )}
      </div>

      {/* Day labels */}
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {Array.from({ length: 7 }).map((_, i) => {
          const dayTime = data.startTime + i * 24 * 60 * 60 * 1000;
          return <span key={i.toString()}>{formatDayLabel(dayTime)}</span>;
        })}
      </div>
    </div>
  );
}
