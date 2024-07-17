import { track } from "@midday/events/client";
import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type Props = {
  id: string;
  onSelect: (id: string) => void;
};

export function PlaidConnect({ id, onSelect }: Props) {
  const [token, setToken] = useState();

  // useEffect(() => {
  //     async function createLinkToken() {
  //       const response = await fetch("/api/plaid/create-link-token", {
  //         method: "POST",
  //       });
  //       const { link_token } = await response.json();
  //       setToken(link_token);
  //     }

  //     if (isOpen) {
  //       createLinkToken();
  //     }
  //   }, [isOpen]);

  const { open } = usePlaidLink({
    token,
    publicKey: "",
    env: process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT!,
    clientName: "Midday",
    product: ["transactions"],
    onSuccess: async (public_token, metadata) => {
      const response = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        body: JSON.stringify({ public_token }),
      });

      const { access_token } = await response.json();

      //   setParams({
      //     step: "account",
      //     provider: "plaid",
      //     token: access_token,
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

  return null;
}
