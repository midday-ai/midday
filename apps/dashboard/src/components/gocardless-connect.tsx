import { createGoCardLessLinkAction } from "@/actions/institutions/create-gocardless-link";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useAction } from "next-safe-action/hooks";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  availableHistory: number;
  onSelect: () => void;
};

export function GoCardLessConnect({ onSelect, id, availableHistory }: Props) {
  const createGoCardLessLink = useAction(createGoCardLessLinkAction);

  const handleOnSelect = () => {
    onSelect();

    createGoCardLessLink.execute({
      institutionId: id,
      availableHistory: availableHistory,
      redirectBase: isDesktopApp() ? "midday://" : window.location.origin,
    });
  };

  return <BankConnectButton onClick={handleOnSelect} />;
}
