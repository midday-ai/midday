"use client";

import { useReconciliationFilterParams } from "@/hooks/use-reconciliation-filter-params";
import { useReconciliationStore } from "@/store/reconciliation";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ExpectedPaymentsPanel } from "./expected-payments-panel";
import { ManualMatchDialog } from "./manual-match-dialog";
import { SessionHeader } from "./session-header";
import { TransactionPanel } from "./transaction-panel";

export function ReconciliationWorkspace() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { filter } = useReconciliationFilterParams();
  const { activeSessionId } = useReconciliationStore();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);

  const { data: viewData } = useSuspenseQuery(
    trpc.reconciliation.getReconciliationView.queryOptions({
      start: filter.start ?? undefined,
      end: filter.end ?? undefined,
      bankAccountIds: filter.accounts ?? undefined,
    }),
  );

  const manualMatchMutation = useMutation(
    trpc.reconciliation.manualMatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getReconciliationView.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getPaymentFeed.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getStats.queryKey(),
        });
        setSelectedTxId(null);
        setSelectedDealId(null);
        toast({
          title: "Match created",
          variant: "success",
        });
      },
    }),
  );

  const confirmMatchMutation = useMutation(
    trpc.reconciliation.confirmMatch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getReconciliationView.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getStats.queryKey(),
        });
        toast({
          title: "Match confirmed",
          variant: "success",
        });
      },
    }),
  );

  const handleMatch = useCallback(() => {
    if (selectedTxId && selectedDealId) {
      setShowMatchDialog(true);
    }
  }, [selectedTxId, selectedDealId]);

  const handleConfirmManualMatch = useCallback(
    (note?: string) => {
      if (!selectedTxId || !selectedDealId) return;
      manualMatchMutation.mutate({
        transactionId: selectedTxId,
        dealId: selectedDealId,
        note,
      });
      setShowMatchDialog(false);
    },
    [selectedTxId, selectedDealId, manualMatchMutation],
  );

  const handleConfirmSuggested = useCallback(
    (transactionId: string) => {
      confirmMatchMutation.mutate({ transactionId });
    },
    [confirmMatchMutation],
  );

  const transactions = viewData?.transactions ?? [];
  const expectedPayments = viewData?.expectedPayments ?? [];

  // Compute variance
  const totalBank = transactions.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0,
  );
  const totalExpected = expectedPayments.reduce(
    (sum, p) => sum + p.expectedAmount,
    0,
  );
  const variance = totalBank - totalExpected;

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <SessionHeader
        transactionCount={transactions.length}
        totalBank={totalBank}
        totalExpected={totalExpected}
        variance={variance}
      />

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left panel: Bank transactions */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-muted/50 border-b">
            <h3 className="text-sm font-medium">Bank Transactions</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <TransactionPanel
              transactions={transactions}
              selectedId={selectedTxId}
              onSelect={setSelectedTxId}
              onConfirmSuggested={handleConfirmSuggested}
            />
          </div>
        </div>

        {/* Center: Match button */}
        <div className="flex flex-col items-center justify-center gap-2 w-16">
          <button
            type="button"
            disabled={!selectedTxId || !selectedDealId}
            onClick={handleMatch}
            className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
              selectedTxId && selectedDealId
                ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                : "border-gray-200 text-gray-300 cursor-not-allowed",
            )}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10H16M16 10L12 6M16 10L12 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="text-[10px] text-muted-foreground text-center">
            Match
          </span>
        </div>

        {/* Right panel: Expected payments */}
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-muted/50 border-b">
            <h3 className="text-sm font-medium">Expected Payments</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <ExpectedPaymentsPanel
              payments={expectedPayments}
              selectedId={selectedDealId}
              onSelect={setSelectedDealId}
            />
          </div>
        </div>
      </div>

      <ManualMatchDialog
        open={showMatchDialog}
        onOpenChange={setShowMatchDialog}
        onConfirm={handleConfirmManualMatch}
        isPending={manualMatchMutation.isPending}
      />
    </div>
  );
}
