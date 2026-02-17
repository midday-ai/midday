import { isDesktopApp } from "@midday/desktop-client/platform";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { BankConnectButton } from "./bank-connect-button";

type Props = {
  id: string;
  onSelect: () => void;
  maximumConsentValidity: number;
  country: string;
  type?: "personal" | "business";
  redirectPath?: string;
  connectRef?: React.MutableRefObject<(() => void) | null>;
};

export function EnableBankingConnect({
  onSelect,
  id,
  maximumConsentValidity,
  country,
  type,
  redirectPath,
  connectRef,
}: Props) {
  const { toast } = useToast();
  const trpc = useTRPC();
  const { data: team } = useQuery(trpc.team.current.queryOptions());

  const createLink = useMutation(
    trpc.banking.enablebankingLink.mutationOptions({}),
  );

  const handleOnSelect = async () => {
    if (!team?.id) {
      return;
    }

    onSelect();

    try {
      const desktopOrWeb = isDesktopApp() ? "desktop" : "web";
      const stateParts = [desktopOrWeb, "connect"];
      if (redirectPath) {
        stateParts.push(encodeURIComponent(redirectPath));
      }

      const linkData = await createLink.mutateAsync({
        institutionId: id,
        country: country || team.countryCode || "",
        type: type ?? "business",
        teamId: team.id,
        validUntil: new Date(Date.now() + maximumConsentValidity * 1000)
          .toISOString()
          .replace(/\.\d+Z$/, ".000000+00:00"),
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
