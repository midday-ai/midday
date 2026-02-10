import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Clock, Timer } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { SortableHeader, useSort } from "@/components/shared/sortable-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDelayedSchedulers,
  useRefresh,
  useRepeatableSchedulers,
} from "@/lib/hooks";
import { formatDuration } from "@/lib/utils";
import type { SchedulersSearch } from "@/router";

interface SchedulersPageProps {
  search: SchedulersSearch;
  onSearchChange: (search: SchedulersSearch) => void;
}

export function SchedulersPage({
  search,
  onSearchChange,
}: SchedulersPageProps) {
  const _queryClient = useQueryClient();

  // Sort hooks
  const { currentSort: repeatableSort, handleSort: handleRepeatableSort } =
    useSort(search.repeatableSort, (sort) =>
      onSearchChange({ ...search, repeatableSort: sort }),
    );
  const { currentSort: delayedSort, handleSort: handleDelayedSort } = useSort(
    search.delayedSort,
    (sort) => onSearchChange({ ...search, delayedSort: sort }),
  );

  const {
    data: repeatable = [],
    isLoading: repeatableLoading,
    error: repeatableError,
    isRefetching: repeatableRefetching,
  } = useRepeatableSchedulers(search.repeatableSort);
  const {
    data: delayed = [],
    isLoading: delayedLoading,
    error: delayedError,
    isRefetching: delayedRefetching,
  } = useDelayedSchedulers(search.delayedSort);

  // Server-side cache refresh
  const refreshMutation = useRefresh();

  const _loading =
    repeatableLoading ||
    delayedLoading ||
    repeatableRefetching ||
    delayedRefetching ||
    refreshMutation.isPending;
  const error = repeatableError || delayedError;

  const _refresh = () => {
    refreshMutation.mutate();
  };

  if (repeatableLoading || delayedLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-28 animate-pulse rounded bg-muted" />
          </div>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-dashed py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Queue</div>
            <div className="col-span-3">Pattern</div>
            <div className="col-span-2">Next Run</div>
            <div className="col-span-2">Timezone</div>
          </div>
          {/* Skeleton Rows */}
          <div className="divide-y divide-border/50">
            {[...Array(10)].map((_, i) => (
              <div
                key={`pulse-${i.toString()}`}
                className="grid grid-cols-12 items-center gap-4 py-3"
              >
                <div className="col-span-3 flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="col-span-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="col-span-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="col-span-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="col-span-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load schedulers"
        description={error.message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={search.tab || "repeatable"}
        onValueChange={(tab) =>
          onSearchChange({ ...search, tab: tab as "repeatable" | "delayed" })
        }
      >
        <TabsList>
          <TabsTrigger value="repeatable">
            Repeatable ({repeatable.length})
          </TabsTrigger>
          <TabsTrigger value="delayed">Delayed ({delayed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="repeatable" className="mt-4">
          {repeatable.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No repeatable jobs"
              description="No cron or repeating jobs are configured"
            />
          ) : (
            <div className="divide-y divide-border/50">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 border-b border-dashed py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">
                  <SortableHeader
                    field="name"
                    label="Name"
                    currentSort={repeatableSort}
                    onSort={handleRepeatableSort}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    field="queueName"
                    label="Queue"
                    currentSort={repeatableSort}
                    onSort={handleRepeatableSort}
                  />
                </div>
                <div className="col-span-3">
                  <SortableHeader
                    field="pattern"
                    label="Pattern"
                    currentSort={repeatableSort}
                    onSort={handleRepeatableSort}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    field="next"
                    label="Next Run"
                    currentSort={repeatableSort}
                    onSort={handleRepeatableSort}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    field="tz"
                    label="Timezone"
                    currentSort={repeatableSort}
                    onSort={handleRepeatableSort}
                  />
                </div>
              </div>

              {/* Rows */}
              {repeatable.map((scheduler) => (
                <div
                  key={scheduler.key}
                  className="grid grid-cols-12 items-center gap-4 py-3 text-sm"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">
                      {scheduler.name}
                    </span>
                  </div>
                  <div className="col-span-2 truncate font-mono text-xs text-muted-foreground">
                    {scheduler.queueName}
                  </div>
                  <div className="col-span-3 font-mono text-xs">
                    {scheduler.pattern ||
                      (scheduler.every
                        ? `every ${formatDuration(scheduler.every)}`
                        : "-")}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {scheduler.next ? (
                      <RelativeTime timestamp={scheduler.next} />
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {scheduler.tz || "UTC"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delayed" className="mt-4">
          {delayed.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="No delayed jobs"
              description="No jobs are scheduled for future execution"
            />
          ) : (
            <div className="divide-y divide-border/50">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 border-b border-dashed py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">
                  <SortableHeader
                    field="name"
                    label="Name"
                    currentSort={delayedSort}
                    onSort={handleDelayedSort}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    field="queueName"
                    label="Queue"
                    currentSort={delayedSort}
                    onSort={handleDelayedSort}
                  />
                </div>
                <div className="col-span-2">Job ID</div>
                <div className="col-span-3">
                  <SortableHeader
                    field="processAt"
                    label="Executes At"
                    currentSort={delayedSort}
                    onSort={handleDelayedSort}
                  />
                </div>
                <div className="col-span-2">
                  <SortableHeader
                    field="delay"
                    label="Delay"
                    currentSort={delayedSort}
                    onSort={handleDelayedSort}
                  />
                </div>
              </div>

              {/* Rows */}
              {delayed.map((job) => (
                <div
                  key={`${job.queueName}-${job.id}`}
                  className="grid grid-cols-12 items-center gap-4 py-3 text-sm"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Timer className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{job.name}</span>
                  </div>
                  <div className="col-span-2 truncate font-mono text-xs text-muted-foreground">
                    {job.queueName}
                  </div>
                  <div className="col-span-2 truncate font-mono text-xs text-muted-foreground">
                    {job.id}
                  </div>
                  <div className="col-span-3 text-muted-foreground">
                    <RelativeTime timestamp={job.processAt} />
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {formatDuration(job.delay)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
