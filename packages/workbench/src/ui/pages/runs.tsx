import {
  BulkBottomBar,
  type BulkSelection,
} from "@/components/shared/bulk-bottom-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { SortableHeader, useSort } from "@/components/shared/sortable-header";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { SmartSearch, parseSearchQuery } from "@/components/smart-search";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RunInfo } from "@/core/types";
import {
  queryKeys,
  useBulkDelete,
  useBulkPromote,
  useBulkRetry,
  useRuns,
} from "@/lib/hooks";
import { cn, formatDuration, truncate } from "@/lib/utils";
import type { RunsSearch } from "@/router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileText, RefreshCw, X } from "lucide-react";
import * as React from "react";

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
  const queryClient = useQueryClient();

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

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useRuns(search.sort);

  // Parse tag filters from the q param
  const parsedQuery = React.useMemo(
    () => parseSearchQuery(search.q ?? ""),
    [search.q],
  );

  // Derive time range from URL params
  const timeRange = React.useMemo(() => {
    if (search.from && search.to) {
      return { start: search.from, end: search.to };
    }
    return null;
  }, [search.from, search.to]);

  // Flatten all pages into a single array
  const runs = React.useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const total = data?.pages[0]?.total ?? 0;

  const filteredRuns = React.useMemo(() => {
    let filtered = runs;

    // Time range filter
    if (timeRange) {
      filtered = filtered.filter((run) => {
        const time = run.processedOn || run.timestamp;
        return time >= timeRange.start && time <= timeRange.end;
      });
    }

    // Status filter from URL
    const statusFilter = search.status ?? "all";
    if (statusFilter !== "all") {
      filtered = filtered.filter((run) => run.status === statusFilter);
    }

    // Tag filters from parsed query
    const tagFilters = Object.entries(parsedQuery.tags);
    if (tagFilters.length > 0) {
      filtered = filtered.filter((run) => {
        if (!run.tags) return false;
        return tagFilters.every(([field, value]) => {
          const tagValue = run.tags?.[field];
          return (
            tagValue !== undefined &&
            String(tagValue).toLowerCase().includes(value.toLowerCase())
          );
        });
      });
    }

    // Text search from parsed query
    if (parsedQuery.text) {
      const query = parsedQuery.text.toLowerCase();
      filtered = filtered.filter(
        (run) =>
          run.name.toLowerCase().includes(query) ||
          run.id.toLowerCase().includes(query) ||
          run.queueName.toLowerCase().includes(query) ||
          (run.tags &&
            Object.entries(run.tags).some(
              ([key, val]) =>
                key.toLowerCase().includes(query) ||
                String(val).toLowerCase().includes(query),
            )),
      );
    }

    return filtered;
  }, [runs, search.status, parsedQuery, timeRange]);

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

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs(search.sort) });
  };

  const loading = isLoading || isRefetching;

  // Selection helpers
  const selectionKey = (queueName: string, jobId: string) =>
    `${queueName}:${jobId}`;

  const isSelected = (queueName: string, jobId: string) =>
    selection.has(selectionKey(queueName, jobId));

  const toggleSelection = (run: RunInfo) => {
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

  // Timeline data - last 30 minutes with 60-second buckets
  const timelineData = React.useMemo(() => {
    const now = Date.now();
    const duration = 30 * 60 * 1000; // 30 minutes
    const bucketSize = 60 * 1000; // 60 seconds
    const bucketCount = Math.ceil(duration / bucketSize);
    const startTime = now - duration;

    const buckets: {
      time: number;
      label: string;
      success: number;
      error: number;
    }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = startTime + i * bucketSize;
      const bucketEnd = bucketStart + bucketSize;
      const date = new Date(bucketStart);

      const runsInBucket = runs.filter((run) => {
        const time = run.processedOn || run.timestamp;
        return time >= bucketStart && time < bucketEnd;
      });

      buckets.push({
        time: bucketStart,
        label: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        success: runsInBucket.filter((r) => r.status === "completed").length,
        error: runsInBucket.filter((r) => r.status === "failed").length,
      });
    }

    return { buckets, startTime, endTime: now, bucketSize };
  }, [runs]);

  const totalSuccess = timelineData.buckets.reduce(
    (sum, b) => sum + b.success,
    0,
  );
  const totalError = timelineData.buckets.reduce((sum, b) => sum + b.error, 0);

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
      {/* Sticky header section */}
      <div className="sticky top-0 z-20 bg-background">
        {/* Activity Timeline */}
        <div className="px-4 py-2">
          <ActivityTimeline
            data={timelineData}
            selection={timeRange}
            onSelectionChange={handleTimeRangeChange}
            totalSuccess={totalSuccess}
            totalError={totalError}
          />
        </div>

        {/* Smart Search */}
        <div className="flex items-center gap-2 border-b border-t py-3">
          <div className="flex-1">
            <SmartSearch
              value={search.q ?? ""}
              status={search.status}
              totalCount={total}
              onChange={handleSearchChange}
            />
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            className="h-9 w-9 shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 border-b px-4 py-2 text-[11px] uppercase tracking-wider">
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
        <div className="divide-y divide-border">
          {[...Array(15)].map((_, i) => (
            <div
              key={i.toString()}
              className="grid grid-cols-12 items-center gap-4 px-4 py-3"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="col-span-2">
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="col-span-1">
                <div className="h-4 w-12 animate-pulse rounded bg-muted" />
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
          <div className="divide-y">
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
          <div className="px-4 py-2 text-xs text-muted-foreground">
            Showing {filteredRuns.length} of {total} runs
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
  run: RunInfo;
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
      className="group grid w-full grid-cols-12 items-center gap-4 px-4 py-3 text-left text-sm cursor-pointer"
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
  buckets: { time: number; label: string; success: number; error: number }[];
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

  const formatTimeLabel = (time: number) => {
    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Calculate selection position for overlay
  const getSelectionStyle = (range: { start: number; end: number }) => {
    const duration = data.endTime - data.startTime;
    const left = ((range.start - data.startTime) / duration) * 100;
    const width = ((range.end - range.start) / duration) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="space-y-2">
      {/* Selection clear button */}
      {selection && (
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange(null)}
            className="h-6 gap-1 px-2 text-xs"
          >
            <X className="h-3 w-3" />
            Clear selection
          </Button>
        </div>
      )}

      {/* Chart area */}
      <div
        ref={containerRef}
        className="relative h-8 cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Bars */}
        <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between">
          {data.buckets.map((bucket, i) => {
            const total = bucket.success + bucket.error;
            const height =
              total > 0 ? Math.max((total / maxValue) * 100, 15) : 0;

            return (
              <Tooltip key={i.toString()}>
                <TooltipTrigger asChild>
                  <div className="relative h-full w-[2px]">
                    <div
                      className="absolute bottom-0 w-[2px] bg-muted-foreground/60"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                </TooltipTrigger>
                {total > 0 && (
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-mono text-muted-foreground">
                      {bucket.label}
                    </div>
                    <div className="font-medium">
                      {total} {total === 1 ? "run" : "runs"}
                    </div>
                    {bucket.success > 0 && (
                      <div className="text-muted-foreground">
                        {bucket.success} success
                      </div>
                    )}
                    {bucket.error > 0 && (
                      <div className="text-muted-foreground">
                        {bucket.error} failed
                      </div>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        {/* Baseline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />

        {/* Drag selection overlay */}
        {isDragging && dragStart !== null && dragEnd !== null && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 border-x border-primary/50 bg-primary/10"
            style={getSelectionStyle({
              start: Math.min(dragStart, dragEnd),
              end: Math.max(dragStart, dragEnd),
            })}
          />
        )}

        {/* Active selection overlay */}
        {selection && !isDragging && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 border-x-2 border-primary/70 bg-primary/20"
            style={getSelectionStyle(selection)}
          >
            {/* Selection time labels */}
            <div className="absolute -top-5 left-0 text-[10px] font-medium text-primary">
              {formatTimeLabel(selection.start)}
            </div>
            <div className="absolute -top-5 right-0 text-[10px] font-medium text-primary">
              {formatTimeLabel(selection.end)}
            </div>
          </div>
        )}
      </div>

      {/* Time axis - single label at end */}
      <div className="relative flex h-4 justify-end">
        <span className="text-[10px] text-muted-foreground">
          {formatTimeLabel(data.endTime)}
        </span>
      </div>
    </div>
  );
}
