import { useConnectParams } from "@/hooks/use-connect-params";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { BankConnectButton } from "./bank-connect-button";
import { EnableBankingConnect } from "./enablebanking-connect";
import { GoCardLessConnect } from "./gocardless-connect";
import { TellerConnect } from "./teller-connect";

type Props = {
  id: string;
  name: string;
  provider: string;
  availableHistory: number;
  maximumConsentValidity: number;
  openPlaid: () => void;
  type?: "personal" | "business";
};

export function ConnectBankProvider({
  id,
  name,
  provider,
  openPlaid,
  availableHistory,
  maximumConsentValidity,
  type,
}: Props) {
  const { setParams, countryCode } = useConnectParams();
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
        />
      );
    }
    case "enablebanking": {
      return (
        <EnableBankingConnect
          id={name}
          country={countryCode}
          maximumConsentValidity={maximumConsentValidity}
          type={type}
          onSelect={() => {
            updateUsage();
          }}
        />
      );
    }
    case "plaid":
      return (
        <BankConnectButton
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
