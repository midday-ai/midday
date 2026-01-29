"use client";

import { useJobStatus } from "@/hooks/use-job-status";
import { useEffect, useState } from "react";

type UseSyncStatusProps = {
  jobId?: string;
};

export function useSyncStatus({ jobId: initialJobId }: UseSyncStatusProps) {
  const [jobId, setJobId] = useState<string | undefined>(initialJobId);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);

  const {
    status: jobStatus,
    result,
    error,
  } = useJobStatus({
    jobId,
    enabled: !!jobId,
  });

  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      setStatus("SYNCING");
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

  return {
    status,
    setStatus,
    result,
  };
}
