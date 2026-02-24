import { skipToken, useQuery } from "@tanstack/react-query";
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
  const [result, setResult] = useState<
    { attachmentsProcessed?: number } | undefined
  >();
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | undefined>();
  const settled = useRef(false);

  const { data } = useQuery(
    trpc.jobs.getStatus.queryOptions(jobId ? { jobId } : skipToken, {
      enabled: !settled.current,
      refetchInterval: POLL_INTERVAL_MS,
      refetchIntervalInBackground: false,
    }),
  );

  useEffect(() => {
    if (initialJobId) {
      settled.current = false;
      setJobId(initialJobId);
      setStatus("SYNCING");
      setSyncMetadata(undefined);
      setResult(undefined);
    } else {
      settled.current = true;
      setJobId(undefined);
    }
  }, [initialJobId]);

  useEffect(() => {
    if (!data || settled.current) return;

    if (
      data.progress &&
      typeof data.progress === "object" &&
      !Array.isArray(data.progress)
    ) {
      const p = data.progress;
      setSyncMetadata({
        discoveredCount:
          typeof p.discoveredCount === "number" ? p.discoveredCount : undefined,
        uploadedCount:
          typeof p.uploadedCount === "number" ? p.uploadedCount : undefined,
        processedCount:
          typeof p.processedCount === "number" ? p.processedCount : undefined,
        status:
          typeof p.status === "string"
            ? (p.status as SyncMetadata["status"])
            : undefined,
      });
    }

    if (data.status === "completed") {
      settled.current = true;
      setStatus("COMPLETED");
      if (data.result && typeof data.result === "object") {
        const r = data.result as Record<string, unknown>;
        setResult({
          attachmentsProcessed:
            typeof r.attachmentsProcessed === "number"
              ? r.attachmentsProcessed
              : undefined,
        });
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
