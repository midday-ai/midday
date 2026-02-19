import { useMutation } from "@tanstack/react-query";
import type { MutableRefObject } from "react";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useTRPC } from "@/trpc/client";
import { BankConnectButton } from "./bank-connect-button";
import { EnableBankingConnect } from "./enablebanking-connect";
import { GoCardLessConnect } from "./gocardless-connect";
import { TellerConnect } from "./teller-connect";

type Props = {
  id: string;
  provider: string;
  availableHistory: number;
  openPlaid: () => void;
  redirectPath?: string;
  countryCode?: string;
  connectRef?: MutableRefObject<(() => void) | null>;
};

export function ConnectBankProvider({
  id,
  provider,
  openPlaid,
  availableHistory,
  redirectPath,
  countryCode,
  connectRef,
}: Props) {
  const { setParams } = useConnectParams();
  const trpc = useTRPC();
  const updateUsageMutation = useMutation(
    trpc.institutions.updateUsage.mutationOptions(),
  );

  const updateUsage = () => {
    updateUsageMutation.mutate({ id });
  };

  switch (provider) {
    case "teller":
      return (
        <TellerConnect
          id={id}
          connectRef={connectRef}
          onSelect={() => {
            // NOTE: Wait for Teller sdk to be configured
            setTimeout(() => {
              setParams({ step: null });
            }, 950);

            updateUsage();
          }}
        />
      );
    case "gocardless": {
      return (
        <GoCardLessConnect
          id={id}
          availableHistory={availableHistory}
          onSelect={() => {
            updateUsage();
          }}
          redirectPath={redirectPath}
          connectRef={connectRef}
        />
      );
    }
    case "enablebanking": {
      return (
        <EnableBankingConnect
          institutionId={id}
          countryCode={countryCode}
          onSelect={() => {
            updateUsage();
          }}
          redirectPath={redirectPath}
          connectRef={connectRef}
        />
      );
    }
    case "plaid":
      return (
        <BankConnectButton
          connectRef={connectRef}
          onClick={() => {
            updateUsage();
            openPlaid();
          }}
        />
      );
    default:
      return null;
  }
}
