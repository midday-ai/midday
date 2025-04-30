"use client";

import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useTeamQuery } from "@/hooks/use-team";
import { uniqueCurrencies } from "@midday/location/currencies";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useEffect, useState } from "react";

export function SelectCurrency() {
  const { toast } = useToast();
  const [isSyncing, setSyncing] = useState(false);
  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const { data: team } = useTeamQuery();

  const { status, setStatus } = useSyncStatus({ runId, accessToken });

  // const updateCurrency = useAction(updateCurrencyAction, {
  //   onExecute: () => setSyncing(true),
  //   onSuccess: ({ data }) => {
  //     if (data) {
  //       setRunId(data.id);
  //       setAccessToken(data.publicAccessToken);
  //     }
  //   },
  //   onError: () => {
  //     setRunId(undefined);

  //     toast({
  //       duration: 3500,
  //       variant: "error",
  //       title: "Something went wrong pleaase try again.",
  //     });
  //   },
  // });

  const handleChange = async (baseCurrency: string) => {
    if (baseCurrency !== team?.base_currency) {
      toast({
        title: "Update base currency",
        description:
          "This will update the base currency for all transactions and account balances.",
        duration: 7000,
        footer: (
          <Button
          // onClick={() =>
          //   updateCurrency.execute({
          //     baseCurrency: baseCurrency.toUpperCase(),
          //   })
          // }
          >
            Update
          </Button>
        ),
      });

      return;
    }
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
