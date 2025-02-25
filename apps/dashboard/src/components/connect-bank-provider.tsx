import { updateInstitutionUsageAction } from "@/actions/institutions/update-institution-usage";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useAction } from "next-safe-action/hooks";
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
};

export function ConnectBankProvider({
  id,
  name,
  provider,
  openPlaid,
  availableHistory,
  maximumConsentValidity,
}: Props) {
  const { setParams, countryCode } = useConnectParams();
  const updateInstitutionUsage = useAction(updateInstitutionUsageAction);

  const updateUsage = () => {
    updateInstitutionUsage.execute({ institutionId: id });
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
