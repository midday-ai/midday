import { createGoCardLessLinkAction } from "@/actions/institutions/create-gocardless-link";
import { useToast } from "@midday/ui/use-toast";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useAction } from "next-safe-action/hooks";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  availableHistory: number;
  onSelect: () => void;
};

export function GoCardLessConnect({ onSelect, id, availableHistory }: Props) {
  const { toast } = useToast();

  const createGoCardLessLink = useAction(createGoCardLessLinkAction, {
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

    createGoCardLessLink.execute({
      institutionId: id,
      availableHistory: availableHistory,
      redirectBase: isDesktopApp() ? "midday://" : window.location.origin,
    });
  };

  return <BankConnectButton onClick={handleOnSelect} />;
}
