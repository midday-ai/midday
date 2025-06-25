"use client";

import { uniqueCurrencies } from "@midday/location/currencies";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { useJobProgress } from "@/hooks/use-job-progress";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";

export function SelectCurrency() {
  const { toast } = useToast();
  const updateTeamMutation = useTeamMutation();
  const { data: team } = useTeamQuery();
  const trpc = useTRPC();
  const [currentJobId, setCurrentJobId] = useState<string | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);

  const { status: jobStatus, result } = useJobProgress({
    jobId: currentJobId,
    queue: "teams",
    enabled: !!currentJobId,
  });
  const updateBaseCurrencyMutation = useMutation(
    trpc.team.updateBaseCurrency.mutationOptions({
      onMutate: () => {
        setIsSyncing(true);
      },
      onSuccess: (data) => {
        if (data) {
          setCurrentJobId(data.flowJobId);
        }
      },
      onError: () => {
        setCurrentJobId(undefined);

        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong pleaase try again.",
        });
      },
    }),
  );

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

  useEffect(() => {
    if (jobStatus === "completed") {
      setIsSyncing(false);
      setCurrentJobId(undefined);

      const accountsProcessed = result?.accountsProcessed || 0;
      const totalTransactions =
        result?.childResults?.reduce((sum: number, child: any) => {
          return sum + (child?.transactionsUpdated || 0);
        }, 0) || 0;

      toast({
        duration: 5000,
        variant: "success",
        title: "Base currency updated successfully!",
        description: `Updated ${accountsProcessed} account${accountsProcessed !== 1 ? "s" : ""} and ${totalTransactions} transaction${totalTransactions !== 1 ? "s" : ""}.`,
      });
    }
  }, [jobStatus, result]);

  useEffect(() => {
    if (isSyncing) {
      toast({
        title: "Updating...",
        description: "We're updating your base currency, please wait.",
        duration: Number.POSITIVE_INFINITY,
        variant: "spinner",
      });
    }
  }, [isSyncing]);

  useEffect(() => {
    if (jobStatus === "failed") {
      setIsSyncing(false);
      setCurrentJobId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    }
  }, [jobStatus]);

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
