"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type UseJobStatusProps = {
  /** Composite job ID (e.g., "accounting:21") containing queue info */
  jobId?: string;
  enabled?: boolean;
  refetchInterval?:
    | number
    | false
    | ((query: { state: { data?: { status?: string } } }) => number | false);
};

/**
 * Hook for polling job status by composite ID
 * Automatically stops polling when job is completed or failed
 */
export function useJobStatus({
  jobId,
  enabled = true,
  refetchInterval,
}: UseJobStatusProps = {}) {
  const trpc = useTRPC();

  const shouldPoll = enabled && !!jobId;

  // Default refetch interval: poll every 1 second, stop when completed or failed
  const defaultRefetchInterval = (query: {
    state: { data?: { status?: string }; status: string };
  }) => {
    const status = query.state.data?.status;
    // Stop polling when completed or failed, otherwise poll every second
    if (status === "completed" || status === "failed") {
      return false;
    }
    // Also stop if the query itself errored (job not found, access denied, etc.)
    if (query.state.status === "error") {
      return false;
    }
    // Continue polling if status is active, waiting, delayed, or unknown
    return 1000;
  };

  const {
    data: jobStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...trpc.jobs.getStatus.queryOptions({ jobId: jobId! }),
    enabled: shouldPoll,
    refetchInterval: refetchInterval ?? defaultRefetchInterval,
    // Ensure we refetch on mount and window focus
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // Don't retry on errors - stop polling instead
    retry: false,
  });

  return {
    status: jobStatus?.status,
    progress: jobStatus?.progress,
    result: jobStatus?.result,
    error: jobStatus?.error,
    isLoading,
    queryError: error,
    refetch,
  };
}
