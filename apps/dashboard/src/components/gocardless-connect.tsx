import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  availableHistory: number;
  onSelect: () => void;
};

export function GoCardLessConnect({ onSelect, id, availableHistory }: Props) {
  const { toast } = useToast();
  const trpc = useTRPC();

  const createAgreementMutation = useMutation({
    ...trpc.banking.createGoCardlessAgreement.mutationOptions(),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const createLinkMutation = useMutation(
    trpc.banking.createGoCardlessLink.mutationOptions(),
  );

  const handleOnSelect = async () => {
    onSelect();

    const redirectBase = isDesktopApp() ? "midday://" : getUrl();
    const redirectTo = new URL(redirectBase);
    redirectTo.searchParams.append("step", "account");
    redirectTo.searchParams.append("provider", "gocardless");

    try {
      const agreement = await createAgreementMutation.mutateAsync({
        institutionId: id,
        transactionTotalDays: availableHistory,
      });

      const link = await createLinkMutation.mutateAsync({
        institutionId: id,
        agreement: agreement.id,
        redirect: redirectTo.toString(),
      });

      window.location.href = link.link;
    } catch {
      // Error handled by onError callback
    }
  };

  return <BankConnectButton onClick={handleOnSelect} />;
}
