import { updateInstitutionUsageAction } from "@/actions/institutions/update-institution-usage";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useAction } from "next-safe-action/hooks";
import { BankConnectButton } from "./bank-connect-button";
import { GoCardLessConnect } from "./gocardless-connect";
import { PluggyConnect } from "./pluggy-connect";
import { TellerConnect } from "./teller-connect";

type Props = {
  id: string;
  provider: string;
  availableHistory: number;
  openPlaid: () => void;
  openPluggy: (props: { institutionId?: string }) => void;
};

export function ConnectBankProvider({
  id,
  provider,
  openPlaid,
  openPluggy,
  availableHistory,
}: Props) {
  const { setParams } = useConnectParams();
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
    case "plaid": {
      return (
        <BankConnectButton
          onClick={() => {
            updateUsage();
            openPlaid();
          }}
        />
      );
    }
    case "pluggy": {
      return (
        <BankConnectButton
          onClick={() => {
            updateUsage();
            openPluggy({ institutionId: id });
          }}
        />
      );
    }
    default:
      return null;
  }
}
