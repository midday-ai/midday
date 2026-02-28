import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useTRPC } from "@/trpc/client";

const syncMetadataSchema = z.object({
  discoveredCount: z.number().optional(),
  uploadedCount: z.number().optional(),
  processedCount: z.number().optional(),
  status: z.enum(["discovering", "extracting", "complete"]).optional(),
});

const syncResultSchema = z.object({
  attachmentsProcessed: z.number().optional(),
});

export type SyncMetadata = z.infer<typeof syncMetadataSchema>;
export type SyncResult = z.infer<typeof syncResultSchema>;

const POLL_INTERVAL_MS = 2000;

export function useSyncStatus({ jobId: initialJobId }: { jobId?: string }) {
  const trpc = useTRPC();
  const [jobId, setJobId] = useState<string | undefined>(initialJobId);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);
  const [result, setResult] = useState<SyncResult | undefined>();
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

    const metadata = syncMetadataSchema.safeParse(data.progressData);
    if (metadata.success) {
      setSyncMetadata(metadata.data);
    }

    if (data.status === "completed" || data.status === "unknown") {
      settled.current = true;
      setStatus("COMPLETED");

      const parsed = syncResultSchema.safeParse(data.result);
      if (parsed.success) {
        setResult(parsed.data);
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
