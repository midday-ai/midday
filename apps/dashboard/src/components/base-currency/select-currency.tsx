"use client";

import { updateCurrencyAction } from "@/actions/transactions/update-currency-action";
import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { uniqueCurrencies } from "@midday/location/currencies";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useEventDetails } from "@trigger.dev/react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

export function SelectCurrency({ defaultValue }: { defaultValue: string }) {
  const { toast } = useToast();
  const [eventId, setEventId] = useState<string | undefined>();
  const [isSyncing, setSyncing] = useState(false);
  const { data } = useEventDetails(eventId);

  const status = data?.runs.at(-1)?.status;

  const error = status === "FAILURE" || status === "TIMED_OUT";

  const updateCurrency = useAction(updateCurrencyAction, {
    onExecute: () => setSyncing(true),
    onSuccess: ({ data }) => {
      if (data?.id) {
        setEventId(data.id);
      }
    },
    onError: () => {
      setEventId(undefined);
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const handleChange = async (baseCurrency: string) => {
    if (baseCurrency !== defaultValue) {
      toast({
        title: "Update base currency",
        description:
          "This will update the base currency for all transactions and account balances.",
        duration: 7000,
        footer: (
          <Button
            onClick={() =>
              updateCurrency.execute({
                baseCurrency: baseCurrency.toUpperCase(),
              })
            }
          >
            Update
          </Button>
        ),
      });

      return;
    }
  };

  useEffect(() => {
    if (status === "SUCCESS") {
      setSyncing(false);
      setEventId(undefined);
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
    if (error) {
      setSyncing(false);
      setEventId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    }
  }, [error]);

  return (
    <div className="w-[200px]">
      <SelectCurrencyBase
        onChange={handleChange}
        currencies={uniqueCurrencies}
        value={defaultValue}
      />
    </div>
  );
}
