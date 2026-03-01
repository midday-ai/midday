"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ToastAction } from "@midday/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSyncToast } from "@/hooks/use-sync-toast";
import { useTRPC } from "@/trpc/client";
import { SyncPeriodDialog } from "./sync-period-dialog";

const SYNC_TOAST_ID = "inbox-initial-sync";

interface InboxInitialSyncProps {
  accountId: string;
  syncJobId?: string;
}

export function InboxInitialSync({
  accountId,
  syncJobId,
}: InboxInitialSyncProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const {
    isSyncing,
    syncComplete,
    attachmentCount,
    startTracking,
    handleMutationError,
  } = useSyncToast({
    toastId: SYNC_TOAST_ID,
    initialJobId: syncJobId,
    labels: {
      syncing: "Importing...",
      defaultProgress:
        "Looking through your emails for receipts and invoices...",
      completed: "Import complete",
      failed: "Import failed, please try again.",
    },
    completedDuration: 8000,
    completedAction: (
      <ToastAction
        altText="Import more"
        onClick={() => setSyncDialogOpen(true)}
      >
        Import more
      </ToastAction>
    ),
  });

  const syncMutation = useMutation(
    trpc.inboxAccounts.sync.mutationOptions({
      onSuccess: (data) => {
        if (data) {
          startTracking(data.id);
        }
      },
      onError: () => {
        handleMutationError();
      },
    }),
  );

  const handleSyncWithDate = (syncStartDate: string) => {
    setSyncDialogOpen(false);
    syncMutation.mutate({
      id: accountId,
      manualSync: true,
      syncStartDate,
    });
  };

  if (syncComplete) {
    return (
      <div className="h-[calc(100vh-300px)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Icons.Inbox2 className="mb-4" />
          <div className="text-center mb-6 space-y-2">
            <h2 className="font-medium text-lg">
              {attachmentCount > 0
                ? `${attachmentCount} ${attachmentCount === 1 ? "receipt" : "receipts"} imported`
                : "No receipts found"}
            </h2>
            <p className="text-[#606060] text-sm">
              We'll keep checking for new receipts automatically.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setSyncDialogOpen(true)}>
              Import more
            </Button>
            {attachmentCount > 0 && (
              <Button onClick={() => router.refresh()}>View inbox</Button>
            )}
          </div>

          <SyncPeriodDialog
            open={syncDialogOpen}
            onOpenChange={setSyncDialogOpen}
            onSync={handleSyncWithDate}
            isSyncing={syncMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (!isSyncing && !syncComplete) {
    return (
      <div className="h-[calc(100vh-300px)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Icons.Inbox2 className="mb-4" />
          <div className="text-center mb-6 space-y-2">
            <h2 className="font-medium text-lg">Your inbox is connected</h2>
            <p className="text-[#606060] text-sm">
              Import your recent receipts and invoices
              <br />
              to get started.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setSyncDialogOpen(true)}>
              Choose period
            </Button>
            <Button
              onClick={() =>
                syncMutation.mutate({
                  id: accountId,
                  manualSync: false,
                  maxResults: 30,
                })
              }
              disabled={syncMutation.isPending}
            >
              Import recent
            </Button>
          </div>

          <SyncPeriodDialog
            open={syncDialogOpen}
            onOpenChange={setSyncDialogOpen}
            onSync={handleSyncWithDate}
            isSyncing={syncMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Inbox2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Setting up your inbox</h2>
          <p className="text-[#606060] text-sm">
            Looking for receipts and invoices
            <br />
            in your recent emails...
          </p>
        </div>
      </div>
    </div>
  );
}
