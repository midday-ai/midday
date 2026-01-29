"use client";

import { useJobStatus } from "@/hooks/use-job-status";
import { useEffect, useState } from "react";

type UseExportStatusProps = {
  jobId?: string;
};

export function useExportStatus({ jobId: initialJobId }: UseExportStatusProps = {}) {
  const [jobId, setJobId] = useState<string | undefined>(initialJobId);
  const [status, setStatus] = useState<
    "FAILED" | "IN_PROGRESS" | "COMPLETED" | null
  >(null);
  const [result, setResult] = useState<unknown>(null);

  const {
    status: jobStatus,
    progress,
    result: jobResult,
    error,
  } = useJobStatus({
    jobId,
    enabled: !!jobId,
  });

  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      setStatus("IN_PROGRESS");
    }
  }, [initialJobId]);

  useEffect(() => {
    if (error || jobStatus === "failed") {
      setStatus("FAILED");
    }

    if (jobStatus === "completed") {
      setStatus("COMPLETED");
    }
  }, [error, jobStatus]);

  useEffect(() => {
    if (jobResult) {
      setResult(jobResult);
    }
  }, [jobResult]);

  return {
    status,
    setStatus,
    progress: progress ?? 0,
    result,
  };
}
