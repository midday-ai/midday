import { isDesktopApp } from "@midday/desktop-client/platform";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  institutionId: string;
  onSelect: () => void;
  redirectPath?: string;
  connectRef?: React.MutableRefObject<(() => void) | null>;
};

export function EnableBankingConnect({
  onSelect,
  institutionId,
  redirectPath,
  connectRef,
}: Props) {
  const { toast } = useToast();
  const trpc = useTRPC();

  const createLink = useMutation(
    trpc.banking.enablebankingLink.mutationOptions({}),
  );

  const handleOnSelect = async () => {
    onSelect();

    try {
      const desktopOrWeb = isDesktopApp() ? "desktop" : "web";
      const stateParts = [desktopOrWeb, "connect"];
      if (redirectPath) {
        stateParts.push(encodeURIComponent(redirectPath));
      }

      const linkData = await createLink.mutateAsync({
        institutionId,
        state: stateParts.join(":"),
      });

      window.location.href = linkData.data.url;
    } catch {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  };

  return <BankConnectButton onClick={handleOnSelect} connectRef={connectRef} />;
}
