import { createPlaidLinkTokenAction } from "@/actions/institutions/create-plaid-link";
import { useConnectParams } from "@/hooks/use-connect-params";
import { track } from "@midday/events/client";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  onSelect: (id: string) => void;
  routingNumber?: string;
};

export function PlaidConnect({ id, onSelect, routingNumber }: Props) {
  const [isLoading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { setParams } = useConnectParams();

  const { open } = usePlaidLink({
    token: "link-production-b2299972-a443-4238-9370-86402c9988f8",
    publicKey: "",
    env: process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT!,
    clientName: "Midday",
    product: ["transactions"],
    onSuccess: async (public_token, metadata) => {
      //   const response = await fetch("/api/plaid/exchange-public-token", {
      //     method: "POST",
      //     body: JSON.stringify({ public_token }),
      //   });
      //   const { access_token } = await response.json();
      //   setParams({
      //     step: "account",
      //     provider: "plaid",
      //     // token: access_token,
      //     institution_id: metadata.institution?.institution_id,
      //   });
      //   track({
      //     event: LogEvents.ConnectBankAuthorized.name,
      //     channel: LogEvents.ConnectBankAuthorized.channel,
      //     provider: "plaid",
      //   });
    },
    onExit: () => {
      //   setParams({ step: "connect" });
      //   track({
      //     event: LogEvents.ConnectBankCanceled.name,
      //     channel: LogEvents.ConnectBankCanceled.channel,
      //     provider: "plaid",
      //   });
    },
  });

  const createPlaidLinkToken = useAction(createPlaidLinkTokenAction, {
    onSuccess: ({ data }) => {
      open();
      if (data) {
        setToken(data);
        open();
      }
    },
    onError: (data) => {
      console.log("error", data);
    },
  });

  return (
    <BankConnectButton
      onClick={() => {
        createPlaidLinkToken.execute({ routingNumber });

        onSelect(id);
        setLoading(true);

        open();
      }}
      isLoading={isLoading}
    />
  );
}
