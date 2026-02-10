"use client";

import { useToast } from "@midday/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { manualSyncTransactionsAction } from "@/actions/transactions/manual-sync-transactions-action";
import { reconnectConnectionAction } from "@/actions/transactions/reconnect-connection-action";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useTRPC } from "@/trpc/client";

type Provider = "gocardless" | "plaid" | "teller" | "enablebanking";

type UseReconnectOptions = {
  connectionId: string;
  provider: string | null;
};

type UseReconnectReturn = {
  isSyncing: boolean;
  status: "FAILED" | "SYNCING" | "COMPLETED" | null;
  triggerReconnect: () => void;
  triggerManualSync: () => void;
};

/**
 * Hook that encapsulates all reconnect and sync logic for bank connections.
 *
 * Handles:
 * - URL param detection for OAuth providers (GoCardless, EnableBanking)
 * - Direct trigger for embedded SDK providers (Teller)
 * - Job status tracking via useSyncStatus
 * - Toast notifications (syncing, success, error)
 * - Query invalidation on completion
 * - URL param cleanup after triggering
 */
export function useReconnect({
  connectionId,
  provider,
}: UseReconnectOptions): UseReconnectReturn {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast, dismiss } = useToast();

  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [isSyncing, setSyncing] = useState(false);

  const { status, setStatus } = useSyncStatus({ runId, accessToken });

  const [params, setParams] = useQueryStates({
    step: parseAsString,
    id: parseAsString,
  });

  // Track if we've already triggered for this URL param combination
  const hasTriggeredRef = useRef(false);

  // Manual sync action (for sync button)
  const manualSyncTransactions = useAction(manualSyncTransactionsAction, {
    onExecute: () => setSyncing(true),
    onSuccess: ({ data }) => {
      if (data) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
      }
    },
    onError: () => {
      setSyncing(false);
      setRunId(undefined);
      setStatus("FAILED");

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  // Reconnect action (for reconnect flow)
  const reconnectConnection = useAction(reconnectConnectionAction, {
    onExecute: () => setSyncing(true),
    onSuccess: ({ data }) => {
      if (data) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
      }
    },
    onError: () => {
      setSyncing(false);
      setRunId(undefined);
      setStatus("FAILED");

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  // Show syncing toast when sync starts
  useEffect(() => {
    if (isSyncing) {
      toast({
        title: "Syncing...",
        description: "We're connecting to your bank, please wait.",
        duration: Number.POSITIVE_INFINITY,
        variant: "spinner",
      });
    }
  }, [isSyncing]);

  // Handle completion - invalidate queries and reset state
  useEffect(() => {
    if (status === "COMPLETED") {
      dismiss();
      setRunId(undefined);
      setSyncing(false);

      // Invalidate all relevant queries
      queryClient.invalidateQueries({
        queryKey: trpc.bankConnections.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankAccounts.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.team.current.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.infiniteQueryKey(),
      });
    }
  }, [status]);

  // Handle failure - show error toast and reset state
  useEffect(() => {
    if (status === "FAILED") {
      dismiss();
      setSyncing(false);
      setRunId(undefined);

      queryClient.invalidateQueries({
        queryKey: trpc.bankConnections.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankAccounts.get.queryKey(),
      });

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  }, [status]);

  // Handle reconnect flow from API route redirect (EnableBanking/GoCardLess)
  // Only trigger for the specific connection that matches the URL param ID
  useEffect(() => {
    if (
      params.step === "reconnect" &&
      params.id === connectionId &&
      !hasTriggeredRef.current
    ) {
      hasTriggeredRef.current = true;

      reconnectConnection.execute({
        connectionId,
        provider: provider as Provider,
      });

      // Clear URL params to prevent re-triggering on page refresh
      setParams({ step: null, id: null });
    }
  }, [params.step, params.id, connectionId, provider]);

  // Trigger reconnect manually (for Teller which uses embedded SDK)
  const triggerReconnect = useCallback(() => {
    reconnectConnection.execute({
      connectionId,
      provider: provider as Provider,
    });
  }, [connectionId, provider]);

  // Trigger manual sync (for sync button)
  const triggerManualSync = useCallback(() => {
    manualSyncTransactions.execute({
      connectionId,
    });
  }, [connectionId]);

  return {
    isSyncing,
    status,
    triggerReconnect,
    triggerManualSync,
  };
}
