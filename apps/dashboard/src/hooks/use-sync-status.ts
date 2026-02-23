import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";

type UseSyncStatusProps = {
  jobId?: string;
};

export type SyncMetadata = {
  discoveredCount?: number;
  uploadedCount?: number;
  processedCount?: number;
  status?: "discovering" | "extracting" | "complete";
};

const POLL_INTERVAL_MS = 2000;

export function useSyncStatus({ jobId: initialJobId }: UseSyncStatusProps) {
  const trpc = useTRPC();
  const [jobId, setJobId] = useState<string | undefined>(initialJobId);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);
  const [result, setResult] = useState<Record<string, unknown> | undefined>();
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | undefined>();
  const settled = useRef(false);

  const { data } = useQuery(
    trpc.jobs.getStatus.queryOptions(
      { jobId: jobId! },
      {
        enabled: !!jobId && !settled.current,
        refetchInterval: POLL_INTERVAL_MS,
        refetchIntervalInBackground: false,
      },
    ),
  );

  useEffect(() => {
    if (initialJobId) {
      settled.current = false;
      setJobId(initialJobId);
      setStatus("SYNCING");
      setSyncMetadata(undefined);
      setResult(undefined);
    }
  }, [initialJobId]);

  useEffect(() => {
    if (!data || settled.current) return;

    if (
      data.progress &&
      typeof data.progress === "object" &&
      !Array.isArray(data.progress)
    ) {
      setSyncMetadata(data.progress as unknown as SyncMetadata);
    }

    if (data.status === "completed") {
      settled.current = true;
      setStatus("COMPLETED");
      if (data.result && typeof data.result === "object") {
        setResult(data.result as Record<string, unknown>);
      }
    } else if (data.status === "failed") {
      settled.current = true;
      setStatus("FAILED");
    } else if (
      data.status === "active" ||
      data.status === "waiting" ||
      data.status === "delayed"
    ) {
      setStatus("SYNCING");
    }
  }, [data]);

  return {
    status,
    setStatus,
    result,
    syncMetadata,
  };
}
