"use client";

import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { useSyncStatus } from "@/hooks/use-sync-status";
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
  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const updateTeamMutation = useTeamMutation();
  const { data: team } = useTeamQuery();

  const updateBaseCurrencyMutation = useMutation(
    trpc.team.updateBaseCurrency.mutationOptions({
      onMutate: () => {
        setSyncing(true);
      },
      onSuccess: (data) => {
        if (data) {
          setRunId(data.id);
          setAccessToken(data.publicAccessToken);
        }
      },
      onError: () => {
        setRunId(undefined);

        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong pleaase try again.",
        });
      },
    }),
  );

  const { status, setStatus } = useSyncStatus({ runId, accessToken });

  const handleChange = async (baseCurrency: string) => {
    updateTeamMutation.mutate(
      {
        base_currency: baseCurrency.toUpperCase(),
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
    if (status === "COMPLETED") {
      setSyncing(false);
      setStatus(null);
      setRunId(undefined);
      toast({
        duration: 3500,
        variant: "success",
        title: "Transactions and account balances updated.",
      });
    }
  }, [status]);

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
    if (status === "FAILED") {
      setSyncing(false);
      setRunId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    }
  }, [status]);

  return (
    <div className="w-[200px]">
      <SelectCurrencyBase
        onChange={handleChange}
        currencies={uniqueCurrencies}
        value={team?.base_currency ?? undefined}
      />
    </div>
  );
}
