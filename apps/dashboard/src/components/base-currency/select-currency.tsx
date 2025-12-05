"use client";

import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { useJobStatus } from "@/hooks/use-job-status";
import { useTeamMutation } from "@/hooks/use-team";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { uniqueCurrencies } from "@midday/location/currencies";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function SelectCurrency() {
  const trpc = useTRPC();
  const { toast } = useToast();
  const [isSyncing, setSyncing] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>();
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

  useEffect(() => {
    if (status === "completed") {
      setSyncing(false);
      setJobId(undefined);
      toast({
        duration: 3500,
        variant: "success",
        title: "Transactions and account balances updated.",
      });
    }
  }, [status, toast]);

  useEffect(() => {
    if (isSyncing && jobId) {
      toast({
        title: "Updating...",
        description: progress
          ? `We're updating your base currency (${progress}%), please wait.`
          : "We're updating your base currency, please wait.",
        duration: Number.POSITIVE_INFINITY,
        variant: "spinner",
      });
    }
  }, [isSyncing, jobId, progress, toast]);

  useEffect(() => {
    if (status === "failed") {
      setSyncing(false);
      setJobId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  }, [status, toast]);

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
