import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { isDesktopApp } from "@midday/desktop-client/platform";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useScript } from "usehooks-ts";

/**
 * Callback type for when a provider reconnect flow completes.
 * - "reconnect": Provider may have changed account IDs, trigger reconnect job
 * - "sync": Provider preserves account IDs (e.g., Plaid update mode), trigger manual sync
 */
type OnCompleteType = "reconnect" | "sync";

type Props = {
  id: string;
  provider: string;
  enrollmentId: string | null;
  institutionId: string;
  referenceId?: string | null;
  accessToken: string | null;
  /**
   * Called when the provider's reconnect flow completes successfully.
   * @param type - "reconnect" if account IDs may have changed, "sync" if they're preserved
   */
  onComplete: (type: OnCompleteType) => void;
  variant?: "button" | "icon";
};

export function ReconnectProvider({
  id,
  provider,
  enrollmentId,
  institutionId,
  referenceId,
  accessToken,
  onComplete,
  variant,
}: Props) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: team } = useTeamQuery();
  const [plaidToken, setPlaidToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const createPlaidLinkMutation = useMutation(
    trpc.banking.createPlaidLink.mutationOptions(),
  );

  const createGoCardlessAgreementMutation = useMutation({
    ...trpc.banking.createGoCardlessAgreement.mutationOptions(),
    onError: () => {
      setIsLoading(false);
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const createGoCardlessLinkMutation = useMutation(
    trpc.banking.createGoCardlessLink.mutationOptions(),
  );

  const createEnableBankingLinkMutation = useMutation({
    ...trpc.banking.createEnableBankingLink.mutationOptions(),
    onError: () => {
      setIsLoading(false);
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  useScript("https://cdn.teller.io/connect/connect.js", {
    removeOnUnmount: false,
  });

  const { open: openPlaid } = usePlaidLink({
    token: plaidToken,
    publicKey: "",
    env: process.env.NEXT_PUBLIC_PLAID_ENVIRONMENT!,
    clientName: "Midday",
    product: ["transactions"],
    onSuccess: () => {
      setPlaidToken(undefined);
      // Plaid uses "update mode" which preserves account IDs - just sync
      onComplete("sync");
    },
    onExit: () => {
      setPlaidToken(undefined);
    },
  });

  const openTeller = () => {
    // @ts-expect-error
    const teller = window.TellerConnect.setup({
      applicationId: process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID!,
      environment: process.env.NEXT_PUBLIC_TELLER_ENVIRONMENT,
      enrollmentId,
      appearance: theme,
      onSuccess: () => {
        // Teller may change account IDs after reconnect - trigger reconnect job
        onComplete("reconnect");
      },
      onFailure: () => {},
    });

    if (teller) {
      teller.open();
    }
  };

  useEffect(() => {
    if (plaidToken) {
      openPlaid();
    }
  }, [plaidToken, openPlaid]);

  const handleOnClick = async () => {
    switch (provider) {
      case "plaid": {
        const result = await createPlaidLinkMutation.mutateAsync({
          accessToken: accessToken ?? undefined,
        });

        if (result.link_token) {
          setPlaidToken(result.link_token);
        }

        return;
      }
      case "gocardless": {
        setIsLoading(true);

        try {
          const reference = `${team?.id}:${nanoid()}`;
          const isDesktop = isDesktopApp();

          const link = new URL(`${getUrl()}/api/gocardless/reconnect`);
          link.searchParams.append("id", id);
          if (isDesktop) {
            link.searchParams.append("desktop", "true");
          }

          const agreement = await createGoCardlessAgreementMutation.mutateAsync(
            {
              institutionId,
              transactionTotalDays: 60,
            },
          );

          const linkData = await createGoCardlessLinkMutation.mutateAsync({
            institutionId,
            agreement: agreement.id,
            redirect: link.toString(),
            reference,
          });

          window.location.href = linkData.link;
        } catch {
          setIsLoading(false);
        }

        return;
      }
      case "enablebanking": {
        setIsLoading(true);

        try {
          const isDesktop = isDesktopApp();

          // Fetch institution to get maximumConsentValidity and name
          const institution = await queryClient.fetchQuery(
            trpc.institutions.getById.queryOptions({ id: institutionId }),
          );

          const maxConsentSeconds =
            typeof institution.maximumConsentValidity === "number"
              ? institution.maximumConsentValidity
              : 0;

          const validUntil = new Date(Date.now() + maxConsentSeconds * 1000)
            .toISOString()
            .replace(/\.\d+Z$/, ".000000+00:00");

          const linkData = await createEnableBankingLinkMutation.mutateAsync({
            institutionId: institution.name,
            country: "",
            teamId: team?.id!,
            type: (institution.type as "business" | "personal") || "personal",
            validUntil,
            state: isDesktop
              ? `desktop:reconnect:${referenceId}`
              : `web:reconnect:${referenceId}`,
          });

          window.location.href = linkData.url;
        } catch {
          setIsLoading(false);
        }

        return;
      }
      case "teller":
        return openTeller();
      default:
        return;
    }
  };

  if (variant === "button") {
    return (
      <Button variant="outline" onClick={handleOnClick} disabled={isLoading}>
        {isLoading ? <Spinner className="size-3.5" /> : "Reconnect"}
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={70}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-7 h-7 flex items-center"
            onClick={handleOnClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="size-3.5" />
            ) : (
              <Icons.Reconnect size={16} />
            )}
          </Button>
        </TooltipTrigger>

        <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
          Reconnect
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
