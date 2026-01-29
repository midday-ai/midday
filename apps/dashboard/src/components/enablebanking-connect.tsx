import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
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
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  const createLinkMutation = useMutation({
    ...trpc.banking.createEnableBankingLink.mutationOptions(),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const handleOnSelect = async () => {
    onSelect();

    if (!team?.id) {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
      return;
    }

    const isDesktop = isDesktopApp();

    try {
      const link = await createLinkMutation.mutateAsync({
        institutionId: id,
        country: country === "" ? country : country,
        type: type ?? "business",
        teamId: team.id,
        validUntil: new Date(Date.now() + maximumConsentValidity * 1000)
          .toISOString()
          .replace(/\.\d+Z$/, ".000000+00:00"),
        state: isDesktop ? "desktop:connect" : "web:connect",
      });

      window.location.href = link.url;
    } catch {
      // Error handled by onError callback
    }
  };

  return <BankConnectButton onClick={handleOnSelect} />;
}
