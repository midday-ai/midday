import { isDesktopApp } from "@midday/desktop-client/platform";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
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

  const createLink = useMutation(
    trpc.banking.enablebankingLink.mutationOptions({}),
  );

  const handleOnSelect = async () => {
    onSelect();

    try {
      const linkData = await createLink.mutateAsync({
        institutionId: id,
        country: country || team?.countryCode || "",
        type: type ?? "business",
        teamId: team?.id ?? "",
        validUntil: new Date(Date.now() + maximumConsentValidity * 1000)
          .toISOString()
          .replace(/\.\d+Z$/, ".000000+00:00"),
        state: isDesktopApp() ? "desktop:connect" : "web:connect",
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

  return <BankConnectButton onClick={handleOnSelect} />;
}
