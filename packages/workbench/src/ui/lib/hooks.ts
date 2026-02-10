import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as React from "react";
import type { JobStatus } from "@/core/types";
import { api } from "./api";

/** Type for dashboard config returned by the API */
export type WorkbenchConfig = Awaited<ReturnType<typeof api.getConfig>>;

// Query keys factory for consistent cache management
export const queryKeys = {
  config: ["config"] as const,
  overview: ["overview"] as const,
  queueNames: ["queue-names"] as const,
  queues: ["queues"] as const,
  queue: (name: string) => ["queue", name] as const,
  jobs: (queueName: string, status?: JobStatus, sort?: string) =>
    ["jobs", queueName, status, sort] as const,
  jobsAll: (queueName: string) => ["jobs", queueName] as const, // For invalidation
  job: (queueName: string, jobId: string) => ["job", queueName, jobId] as const,
  runs: (
    sort?: string,
    filters?: {
      status?: JobStatus;
      tags?: Record<string, string>;
      text?: string;
      timeRange?: { start: number; end: number };
    },
  ) => ["runs", sort, filters] as const,
  runsAll: ["runs"] as const, // For invalidation
  schedulers: {
    repeatable: (sort?: string) => ["schedulers", "repeatable", sort] as const,
    delayed: (sort?: string) => ["schedulers", "delayed", sort] as const,
    all: ["schedulers"] as const, // For invalidation
  },
  search: (query: string) => ["search", query] as const,
  tagValues: (field: string) => ["tagValues", field] as const,
  metrics: ["metrics"] as const,
  activity: ["activity"] as const,
  flows: ["flows"] as const,
  flow: (queueName: string, jobId: string) =>
    ["flow", queueName, jobId] as const,
};

/**
 * Hook for fetching dashboard config
 */
export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => api.getConfig(),
    staleTime: Number.POSITIVE_INFINITY, // Config rarely changes
  });
}

/**
 * Hook for fetching overview stats
 */
export function useOverview() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: ({ signal }) => api.getOverview(signal),
    refetchInterval: 5000,
  });
}

/**
 * Hook for fetching quick job counts (lightweight, for smart polling)
 */
export function useCounts() {
  return useQuery({
    queryKey: ["counts"],
    queryFn: ({ signal }) => api.getCounts(signal),
    refetchInterval: 2000, // Poll counts frequently (very cheap)
    staleTime: 1000, // Consider data stale after 1 second
  });
}

/**
 * Hook for fetching just queue names (fast, no counts)
 * Used for sidebar initial render
 */
export function useQueueNames() {
  return useQuery({
    queryKey: queryKeys.queueNames,
    queryFn: ({ signal }) => api.getQueueNames(signal),
    staleTime: 60000, // Queue names rarely change, cache for 1 minute
  });
}

/**
 * Hook for fetching full queue info with counts
 */
export function useQueues() {
  return useQuery({
    queryKey: queryKeys.queues,
    queryFn: ({ signal }) => api.getQueues(signal),
    refetchInterval: 5000,
  });
}

/**
 * Hook to get a single queue's info from the cached queues data
 * Returns undefined if not yet loaded
 */
export function useQueueInfo(queueName: string) {
  const { data: queues } = useQueues();
  return React.useMemo(
    () => queues?.find((q) => q.name === queueName),
    [queues, queueName],
  );
}

/**
 * Hook for fetching 24-hour metrics
 */
export function useMetrics() {
  return useQuery({
    queryKey: queryKeys.metrics,
    queryFn: ({ signal }) => api.getMetrics(signal),
    refetchInterval: 30000, // Refresh every 30 seconds (metrics are compute-heavy)
  });
}

/**
 * Hook for fetching 7-day activity stats for timeline
 */
export function useActivityStats() {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: ({ signal }) => api.getActivityStats(signal),
    refetchInterval: 30000, // Refresh every 30 seconds (cached server-side)
  });
}

/**
 * Hook for fetching jobs with pagination and sorting
 */
export function useJobs(queueName: string, status?: JobStatus, sort?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.jobs(queueName, status, sort),
    queryFn: ({ pageParam }) =>
      api.getJobs(queueName, { status, limit: 50, cursor: pageParam, sort }),
    getNextPageParam: (lastPage) => lastPage.cursor,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 5000,
  });
}

/**
 * Hook for fetching a single job
 */
export function useJob(queueName: string, jobId: string) {
  return useQuery({
    queryKey: queryKeys.job(queueName, jobId),
    queryFn: () => api.getJob(queueName, jobId),
    refetchInterval: 5000,
  });
}

/**
 * Hook for fetching all runs with sorting and filtering
 * Optimized for fast initial load with reasonable polling
 */
export function useRuns(
  sort?: string,
  filters?: {
    status?: JobStatus;
    tags?: Record<string, string>;
    text?: string;
    timeRange?: { start: number; end: number };
  },
) {
  return useInfiniteQuery({
    queryKey: queryKeys.runs(sort, filters),
    queryFn: ({ pageParam, signal }) =>
      api.getRuns({ limit: 30, cursor: pageParam, sort, ...filters }, signal),
    getNextPageParam: (lastPage) => lastPage.cursor,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 3000, // Consider data stale after 3 seconds
  });
}

/**
 * Hook for fetching repeatable schedulers with sorting
 */
export function useRepeatableSchedulers(sort?: string) {
  return useQuery({
    queryKey: queryKeys.schedulers.repeatable(sort),
    queryFn: () => api.getRepeatableSchedulers(sort),
    refetchInterval: 5000,
  });
}

/**
 * Hook for fetching delayed schedulers with sorting
 */
export function useDelayedSchedulers(sort?: string) {
  return useQuery({
    queryKey: queryKeys.schedulers.delayed(sort),
    queryFn: () => api.getDelayedSchedulers(sort),
    refetchInterval: 5000,
  });
}

/**
 * Hook for search
 */
export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.search(query),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 30, // Cache search results for 30 seconds
  });
}

/**
 * Hook for fetching unique values for a tag field
 */
export function useTagValues(field: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tagValues(field),
    queryFn: () => api.getTagValues(field),
    enabled: enabled && field.length > 0,
    staleTime: 1000 * 60, // Cache tag values for 1 minute
  });
}

// Mutations

/**
 * Hook for clearing server-side cache and refetching all data
 */
export function useRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.refresh(),
    onSuccess: () => {
      // Invalidate all queries to refetch fresh data
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook for retrying a job
 */
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      api.retryJob(queueName, jobId),
    onSuccess: (_, { queueName, jobId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.job(queueName, jobId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll(queueName) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
    },
  });
}

/**
 * Hook for removing a job
 */
export function useRemoveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      api.removeJob(queueName, jobId),
    onSuccess: (_, { queueName }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll(queueName) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

/**
 * Hook for promoting a delayed job
 */
export function usePromoteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      api.promoteJob(queueName, jobId),
    onSuccess: (_, { queueName, jobId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.job(queueName, jobId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll(queueName) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedulers.all });
    },
  });
}

/**
 * Hook for testing a job
 */
export function useTestJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      queueName: string;
      name: string;
      data: unknown;
      delay?: number;
    }) => api.testJob(params),
    onSuccess: (_, { queueName }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll(queueName) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

/**
 * Hook for cleaning queue jobs
 */
export function useCleanQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      queueName,
      status,
    }: {
      queueName: string;
      status: JobStatus;
    }) => api.cleanQueue(queueName, status),
    onSuccess: (_, { queueName }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll(queueName) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Operations
// ─────────────────────────────────────────────────────────────────────────────

type BulkJobParams = { jobs: { queueName: string; jobId: string }[] };
type BulkResult = { success: number; failed: number };

/**
 * Hook for bulk retrying jobs
 */
export function useBulkRetry() {
  const queryClient = useQueryClient();

  return useMutation<BulkResult, Error, BulkJobParams>({
    mutationFn: ({ jobs }) => api.bulkRetry(jobs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

/**
 * Hook for bulk deleting jobs
 */
export function useBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation<BulkResult, Error, BulkJobParams>({
    mutationFn: ({ jobs }) => api.bulkDelete(jobs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

/**
 * Hook for bulk promoting delayed jobs
 */
export function useBulkPromote() {
  const queryClient = useQueryClient();

  return useMutation<BulkResult, Error, BulkJobParams>({
    mutationFn: ({ jobs }) => api.bulkPromote(jobs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedulers.all });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue Control (Pause/Resume)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for pausing a queue
 */
export function usePauseQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueName: string) => api.pauseQueue(queueName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

/**
 * Hook for resuming a queue
 */
export function useResumeQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueName: string) => api.resumeQueue(queueName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for fetching all flows
 */
export function useFlows() {
  return useQuery({
    queryKey: queryKeys.flows,
    queryFn: ({ signal }) => api.getFlows(undefined, signal),
    refetchInterval: 5000,
  });
}

/**
 * Hook for fetching a single flow tree
 */
export function useFlow(queueName: string, jobId: string) {
  return useQuery({
    queryKey: queryKeys.flow(queueName, jobId),
    queryFn: () => api.getFlow(queueName, jobId),
    enabled: !!queueName && !!jobId,
    retry: false, // Don't retry - flow might not exist
    refetchInterval: 5000,
  });
}

/**
 * Hook for creating a flow
 */
export function useCreateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: Parameters<typeof api.createFlow>[0]) =>
      api.createFlow(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flows });
      queryClient.invalidateQueries({ queryKey: queryKeys.runsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues });
    },
  });
}
