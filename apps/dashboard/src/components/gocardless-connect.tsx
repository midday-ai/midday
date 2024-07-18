import { createGoCardLessLinkAction } from "@/actions/institutions/create-gocardless-link";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useAction } from "next-safe-action/hooks";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  availableHistory: number;
  countryCode: string;
  onSelect: () => void;
};

export function GoCardLessConnect({
  onSelect,
  id,
  availableHistory,
  countryCode,
}: Props) {
  const createGoCardLessLink = useAction(createGoCardLessLinkAction);

  const handleOnSelect = () => {
    onSelect();

    createGoCardLessLink.execute({
      institutionId: id,
      availableHistory: availableHistory,
      countryCode,
      redirectBase: isDesktopApp() ? "midday://" : window.location.origin,
    });
  };

  return <BankConnectButton onClick={handleOnSelect} />;
}
