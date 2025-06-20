"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export interface JobProgressUpdate {
  jobId: string;
  jobName: string;
  progress: number;
  status: "active" | "completed" | "failed" | "waiting";
  result?: any;
  error?: string;
  timestamp: number;
}

interface UseJobProgressOptions {
  jobId: string;
  queue: string;
  enabled?: boolean;
  onProgress?: (update: JobProgressUpdate) => void;
  onCompleted?: (result: any) => void;
  onFailed?: (error: string) => void;
  pollInterval?: number; // Defaults to 500ms
}

export function useJobProgress({
  jobId,
  queue,
  enabled = true,
  onProgress,
  onCompleted,
  onFailed,
  pollInterval = 500,
}: UseJobProgressOptions) {
  const trpc = useTRPC();

  const { data, error, isLoading, refetch } = useQuery(
    trpc.jobs.getStatus.queryOptions(
      {
        jobId,
        queue,
      },
      {
        enabled: enabled && !!jobId,
        refetchInterval: (query) => {
          // Stop polling if job is completed or failed
          if (
            query.state.data?.status === "completed" ||
            query.state.data?.status === "failed"
          ) {
            return false;
          }

          return pollInterval;
        },
        retry: (failureCount: number, error: any) => {
          // Don't retry if job not found (likely completed and cleaned up)
          if (error?.message?.includes("Job not found")) {
            return false;
          }

          return failureCount < 3;
        },
      },
    ),
  );

  // Call callbacks when status changes
  useEffect(() => {
    if (!data) return;

    // Always call onProgress for any status update
    onProgress?.(data);

    // Call specific callbacks based on status
    if (data.status === "completed" && data.result) {
      onCompleted?.(data.result);
    } else if (data.status === "failed" && data.error) {
      onFailed?.(data.error);
    }
  }, [
    data?.status,
    data?.progress,
    data?.timestamp,
    onProgress,
    onCompleted,
    onFailed,
  ]);

  return {
    progress: data?.progress ?? 0,
    status: data?.status ?? "waiting",
    result: data?.result,
    error: data?.error ?? (error?.message || null),
    isLoading,
    jobId: data?.jobId ?? jobId,
    jobName: data?.jobName,
    timestamp: data?.timestamp,
    refetch,

    // Computed states for convenience
    isActive: data?.status === "active",
    isCompleted: data?.status === "completed",
    isFailed: data?.status === "failed",
    isWaiting: data?.status === "waiting",
  };
}
