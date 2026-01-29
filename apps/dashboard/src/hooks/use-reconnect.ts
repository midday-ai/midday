"use client";

import { useJobStatus } from "@/hooks/use-job-status";
import { useTRPC } from "@/trpc/client";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";

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
 * - Job status tracking via useJobStatus
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

  const [jobId, setJobId] = useState<string | undefined>();
  const [isSyncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);

  const [params, setParams] = useQueryStates({
    step: parseAsString,
    id: parseAsString,
  });

  // Track if we've already triggered for this URL param combination
  const hasTriggeredRef = useRef(false);

  // Poll job status when we have a jobId
  const { status: jobStatus, error: jobError } = useJobStatus({
    jobId,
  });

  // Manual sync mutation
  const syncMutation = useMutation(
    trpc.bankConnections.sync.mutationOptions({
      onMutate: () => {
        setSyncing(true);
        setStatus("SYNCING");
      },
      onSuccess: (data) => {
        setJobId(data.id);
      },
      onError: () => {
        setSyncing(false);
        setJobId(undefined);
        setStatus("FAILED");
        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
    }),
  );

  // Reconnect mutation
  const reconnectMutation = useMutation(
    trpc.bankConnections.reconnect.mutationOptions({
      onMutate: () => {
        setSyncing(true);
        setStatus("SYNCING");
      },
      onSuccess: (data) => {
        setJobId(data.id);
      },
      onError: () => {
        setSyncing(false);
        setJobId(undefined);
        setStatus("FAILED");
        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
    }),
  );

  // Map job status to our status format
  useEffect(() => {
    if (jobStatus === "completed") {
      setStatus("COMPLETED");
    } else if (jobStatus === "failed" || jobError) {
      setStatus("FAILED");
    } else if (jobStatus === "active" || jobStatus === "waiting") {
      setStatus("SYNCING");
    }
  }, [jobStatus, jobError]);

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
      setJobId(undefined);
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
      setJobId(undefined);

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

      reconnectMutation.mutate({
        connectionId,
        provider: provider as Provider,
      });

      // Clear URL params to prevent re-triggering on page refresh
      setParams({ step: null, id: null });
    }
  }, [params.step, params.id, connectionId, provider]);

  // Trigger reconnect manually (for Teller which uses embedded SDK)
  const triggerReconnect = useCallback(() => {
    reconnectMutation.mutate({
      connectionId,
      provider: provider as Provider,
    });
  }, [connectionId, provider, reconnectMutation]);

  // Trigger manual sync (for sync button)
  const triggerManualSync = useCallback(() => {
    syncMutation.mutate({
      connectionId,
    });
  }, [connectionId, syncMutation]);

  return {
    isSyncing,
    status,
    triggerReconnect,
    triggerManualSync,
  };
}
