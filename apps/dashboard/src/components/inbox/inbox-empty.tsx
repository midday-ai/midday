"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useSyncToast } from "@/hooks/use-sync-toast";
import { useTRPC } from "@/trpc/client";
import { SyncPeriodDialog } from "./sync-period-dialog";

export function NoResults() {
  const { setParams } = useInboxFilterParams();

  return (
    <div className="h-screen -mt-[140px] w-full flex items-center justify-center flex-col">
      <div className="flex flex-col items-center">
        <Icons.Transactions2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">Try another search term</p>
        </div>

        <Button
          variant="outline"
          onClick={() => setParams({ q: null, status: null })}
        >
          Clear search
        </Button>
      </div>
    </div>
  );
}

interface InboxConnectedEmptyProps {
  accountId?: string;
}

export function InboxConnectedEmpty({ accountId }: InboxConnectedEmptyProps) {
  const trpc = useTRPC();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const { startTracking, handleMutationError } = useSyncToast({
    toastId: `sync-empty-${accountId}`,
  });

  const syncMutation = useMutation(
    trpc.inboxAccounts.sync.mutationOptions({
      onSuccess: (data) => {
        setSyncDialogOpen(false);
        if (data) {
          startTracking(data.id);
        }
      },
      onError: () => {
        handleMutationError();
      },
    }),
  );

  const handleSync = (syncStartDate: string) => {
    if (!accountId) return;
    syncMutation.mutate({
      id: accountId,
      manualSync: true,
      syncStartDate,
    });
  };

  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Inbox2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No receipts found</h2>
          <p className="text-[#606060] text-sm">
            We didn't find any receipts or invoices
            <br />
            for this period. Try selecting a longer time range.
          </p>
        </div>

        {accountId && (
          <>
            <Button variant="outline" onClick={() => setSyncDialogOpen(true)}>
              Import more history
            </Button>

            <SyncPeriodDialog
              open={syncDialogOpen}
              onOpenChange={setSyncDialogOpen}
              onSync={handleSync}
              isSyncing={syncMutation.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function InboxOtherEmpty() {
  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.Inbox2 className="mb-4" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No other documents</h2>
          <p className="text-[#606060] text-sm">
            Non-financial documents from your
            <br />
            connected accounts will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
