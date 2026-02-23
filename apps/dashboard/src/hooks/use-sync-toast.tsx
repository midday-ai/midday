"use client";

import { useToast } from "@midday/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useTRPC } from "@/trpc/client";

interface SyncToastLabels {
  syncing: string;
  defaultProgress: string;
  completed: string;
  failed: string;
  mutationError: string;
}

const DEFAULT_LABELS: SyncToastLabels = {
  syncing: "Syncing...",
  defaultProgress:
    "We're scanning for PDF attachments and receipts, please wait.",
  completed: "Sync complete",
  failed: "Sync failed, please try again.",
  mutationError: "Something went wrong, please try again.",
};

interface UseSyncToastOptions {
  toastId: string;
  initialJobId?: string;
  labels?: Partial<SyncToastLabels>;
  completedAction?: ReactNode;
  completedDuration?: number;
  onCompleted?: (attachmentCount: number) => void;
  onFailed?: () => void;
}

export function useSyncToast({
  toastId,
  initialJobId,
  labels: labelOverrides,
  completedAction,
  completedDuration = 3500,
  onCompleted,
  onFailed,
}: UseSyncToastOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };

  const [trackedJobId, setTrackedJobId] = useState<string | undefined>(
    initialJobId,
  );
  const [isSyncing, setIsSyncing] = useState(!!initialJobId);
  const [syncComplete, setSyncComplete] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);

  const { status, setStatus, result, syncMetadata } = useSyncStatus({
    jobId: trackedJobId,
  });

  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;
  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;

  useEffect(() => {
    if (!isSyncing || syncComplete) return;

    const discoveredCount = syncMetadata?.discoveredCount;
    const uploadedCount = syncMetadata?.uploadedCount;
    const metadataStatus = syncMetadata?.status;

    let description = labels.defaultProgress;

    if (metadataStatus === "extracting" && uploadedCount) {
      description = `Found ${uploadedCount} ${uploadedCount === 1 ? "attachment" : "attachments"}, extracting data...`;
    } else if (discoveredCount && !metadataStatus) {
      description = `Discovered ${discoveredCount} ${discoveredCount === 1 ? "email" : "emails"} with attachments...`;
    }

    toast({
      id: toastId,
      title: labels.syncing,
      description,
      duration: Number.POSITIVE_INFINITY,
      variant: "spinner",
    });
  }, [
    isSyncing,
    syncComplete,
    syncMetadata?.status,
    syncMetadata?.uploadedCount,
    syncMetadata?.discoveredCount,
  ]);

  useEffect(() => {
    if (status === "COMPLETED") {
      const count = Number(result?.attachmentsProcessed) || 0;
      setAttachmentCount(count);
      setSyncComplete(true);
      setIsSyncing(false);
      setTrackedJobId(undefined);

      const description =
        count > 0
          ? `Found ${count} new ${count === 1 ? "attachment" : "attachments"}.`
          : "No new attachments found.";

      toast({
        id: toastId,
        title: labels.completed,
        description,
        variant: "success",
        duration: completedDuration,
        ...(completedAction ? { action: completedAction } : {}),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.inboxAccounts.get.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.inbox.get.queryKey(),
      });

      onCompletedRef.current?.(count);
    }
  }, [status]);

  useEffect(() => {
    if (status === "FAILED") {
      setIsSyncing(false);
      setTrackedJobId(undefined);

      queryClient.invalidateQueries({
        queryKey: trpc.inboxAccounts.get.queryKey(),
      });

      toast({
        id: toastId,
        duration: 3500,
        variant: "error",
        title: labels.failed,
      });

      onFailedRef.current?.();
    }
  }, [status]);

  const startTracking = useCallback((jobId: string) => {
    setTrackedJobId(jobId);
    setIsSyncing(true);
    setSyncComplete(false);
    setAttachmentCount(0);
  }, []);

  const handleMutationError = useCallback(() => {
    setIsSyncing(false);
    setTrackedJobId(undefined);
    setStatus("FAILED");

    toast({
      id: toastId,
      duration: 3500,
      variant: "error",
      title: labels.mutationError,
    });
  }, [toastId, labels.mutationError, toast, setStatus]);

  return {
    isSyncing,
    syncComplete,
    attachmentCount,
    startTracking,
    handleMutationError,
    status,
    syncMetadata,
  };
}
