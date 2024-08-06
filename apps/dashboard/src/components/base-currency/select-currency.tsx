"use client";

import { updateBaseCurrencyAction } from "@/actions/transactions/update-base-currency-action";
import { SelectCurrency as SelectCurrencyBase } from "@/components/select-currency";
import { connectionStatus } from "@/utils/connection-status";
import { uniqueCurrencies } from "@midday/location/src/currencies";
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

  const updateBaseCurrency = useAction(updateBaseCurrencyAction, {
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

  const handleChange = async (currency: string) => {
    if (defaultValue && currency !== defaultValue) {
      toast({
        title: "Update base currency",
        description:
          "This will update the base currency for all transactions and account balances.",
        duration: 7000,
        footer: (
          <Button onClick={() => updateBaseCurrency.execute({ currency })}>
            Update
          </Button>
        ),
      });

      return;
    }
  };

  useEffect(() => {
    if (eventId) {
    }
  }, [eventId]);

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
    <SelectCurrencyBase
      onChange={handleChange}
      currencies={uniqueCurrencies}
      value={defaultValue}
      className="w-[200px]"
    />
  );
}
