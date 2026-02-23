"use client";

import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useTRPC } from "@/trpc/client";
import { InboxSelectPeriod } from "./inbox-empty";

interface InboxInitialSyncProps {
  accountId: string;
}

export function InboxInitialSync({ accountId }: InboxInitialSyncProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast, dismiss } = useToast();
  const [jobId, setJobId] = useState<string | undefined>();
  const [isSyncing, setSyncing] = useState(false);

  const { status, setStatus, result, syncMetadata } = useSyncStatus({
    jobId,
  });

  const syncMutation = useMutation(
    trpc.inboxAccounts.sync.mutationOptions({
      onMutate: () => setSyncing(true),
      onSuccess: (data) => {
        if (data) {
          setJobId(data.id);
        }
      },
      onError: () => {
        setSyncing(false);
        setJobId(undefined);
        setStatus("FAILED");
        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong, please try again.",
        });
      },
    }),
  );

  useEffect(() => {
    if (isSyncing) {
      const discoveredCount = syncMetadata?.discoveredCount;
      const uploadedCount = syncMetadata?.uploadedCount;
      const metadataStatus = syncMetadata?.status;

      let description =
        "Looking through your emails for receipts and invoices...";

      if (metadataStatus === "extracting" && uploadedCount) {
        description = `Found ${uploadedCount} ${uploadedCount === 1 ? "receipt" : "receipts"}, reading the details...`;
      } else if (discoveredCount && !metadataStatus) {
        description = `Found ${discoveredCount} ${discoveredCount === 1 ? "email" : "emails"} with attachments...`;
      }

      toast({
        title: "Importing...",
        description,
        duration: Number.POSITIVE_INFINITY,
        variant: "spinner",
      });
    }
  }, [
    isSyncing,
    syncMetadata?.status,
    syncMetadata?.uploadedCount,
    syncMetadata?.discoveredCount,
  ]);

  useEffect(() => {
    if (status === "COMPLETED") {
      dismiss();
      setJobId(undefined);
      setSyncing(false);

      const attachmentCount = Number(result?.attachmentsProcessed) || 0;
      const description =
        attachmentCount > 0
          ? `Found ${attachmentCount} ${attachmentCount === 1 ? "receipt" : "receipts"}.`
          : "No receipts or invoices found for this period.";

      toast({
        title: "Import complete",
        description,
        variant: "success",
        duration: 3500,
      });

      queryClient.invalidateQueries({
        queryKey: trpc.inboxAccounts.get.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.inbox.get.queryKey(),
      });
    }
  }, [status]);

  useEffect(() => {
    if (status === "FAILED") {
      setSyncing(false);
      setJobId(undefined);
      toast({
        duration: 3500,
        variant: "error",
        title: "Import failed, please try again.",
      });
    }
  }, [status]);

  const handleSync = (syncStartDate: string) => {
    syncMutation.mutate({
      id: accountId,
      manualSync: true,
      syncStartDate,
    });
  };

  return <InboxSelectPeriod onSync={handleSync} isSyncing={isSyncing} />;
}
