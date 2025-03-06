import { createEnableBankingLinkAction } from "@/actions/institutions/create-enablebanking-link";
import { useToast } from "@midday/ui/use-toast";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useAction } from "next-safe-action/hooks";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  onSelect: () => void;
  maximumConsentValidity: number;
  country: string;
  type?: "personal" | "business";
};

export function EnableBankingConnect({
  onSelect,
  id,
  maximumConsentValidity,
  country,
  type,
}: Props) {
  const { toast } = useToast();

  const createEnableBankingLink = useAction(createEnableBankingLinkAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const handleOnSelect = () => {
    onSelect();

    createEnableBankingLink.execute({
      institutionId: id,
      maximumConsentValidity,
      country: country === "" ? null : country,
      isDesktop: isDesktopApp(),
      type: type ?? "business",
    });
  };

  return <BankConnectButton onClick={handleOnSelect} />;
}
