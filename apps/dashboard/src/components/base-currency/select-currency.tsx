"use client";

import { uniqueCurrencies } from "@midday/location/currencies";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { useJobStatus } from "@/hooks/use-job-status";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";

export function SelectCurrency() {
  const trpc = useTRPC();
  const { toast, update, dismiss } = useToast();
  const [isSyncing, setSyncing] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>();
  const [toastId, setToastId] = useState<string | null>(null);
  const toastIdRef = useRef<string | null>(null);
  const lastProgressRef = useRef<number | undefined>(undefined);
  const updateTeamMutation = useTeamMutation();
  const { data: team } = useTeamQuery();

  const updateBaseCurrencyMutation = useMutation(
    trpc.team.updateBaseCurrency.mutationOptions({
      onMutate: () => {
        setSyncing(true);
      },
      onSuccess: (data) => {
        if (data?.id) {
          setJobId(data.id);
        }
      },
      onError: () => {
        if (toastIdRef.current) {
          dismiss(toastIdRef.current);
          setToastId(null);
          toastIdRef.current = null;
        }
        setJobId(undefined);
        setSyncing(false);

        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
    }),
  );

  const { status, progress } = useJobStatus({
    jobId,
    enabled: !!jobId,
  });

  const handleChange = async (baseCurrency: string) => {
    updateTeamMutation.mutate(
      {
        baseCurrency: baseCurrency.toUpperCase(),
      },
      {
        onSuccess: () => {
          toast({
            title: "Update base currency",
            description:
              "This will update the base currency for all transactions and account balances.",
            duration: 7000,
            footer: (
              <Button
                onClick={() =>
                  updateBaseCurrencyMutation.mutate({
                    baseCurrency: baseCurrency.toUpperCase(),
                  })
                }
              >
                Update
              </Button>
            ),
          });
        },
      },
    );
  };

  // Create toast when syncing starts
  useEffect(() => {
    if (isSyncing && jobId && !toastId) {
      const { id } = toast({
        title: "Updating...",
        description: "We're updating your base currency, please wait.",
        duration: Number.POSITIVE_INFINITY,
        variant: "progress",
        progress: 0,
      });
      setToastId(id);
      toastIdRef.current = id;
      lastProgressRef.current = 0;
    }
  }, [isSyncing, jobId, toastId]);

  // Update toast progress when it changes
  useEffect(() => {
    if (!toastId || !isSyncing) return;

    const currentProgress = progress !== undefined ? Number(progress) : 0;

    // Only update if progress actually changed
    if (currentProgress !== lastProgressRef.current) {
      lastProgressRef.current = currentProgress;

      update(toastId, {
        id: toastId,
        title: "Updating...",
        description: "We're updating your base currency, please wait.",
        variant: "progress",
        progress: currentProgress,
        duration: Number.POSITIVE_INFINITY,
      });
    }
  }, [progress, toastId, isSyncing]);

  useEffect(() => {
    if (status === "completed" && toastId) {
      dismiss(toastId);
      setToastId(null);
      toastIdRef.current = null;
      lastProgressRef.current = undefined;
      setSyncing(false);
      setJobId(undefined);
      toast({
        duration: 3500,
        variant: "success",
        title: "Transactions and account balances updated.",
      });
    }
  }, [status, toastId]);

  useEffect(() => {
    if (status === "failed" && toastId) {
      dismiss(toastId);
      setToastId(null);
      toastIdRef.current = null;
      lastProgressRef.current = undefined;
      setSyncing(false);
      setJobId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  }, [status, toastId]);

  return (
    <div className="w-[200px]">
      <SelectCurrencyBase
        onChange={handleChange}
        currencies={uniqueCurrencies}
        value={team?.baseCurrency ?? undefined}
      />
    </div>
  );
}
