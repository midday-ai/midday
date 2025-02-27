import { createPlaidLinkTokenAction } from "@/actions/institutions/create-plaid-link";
import { reconnectEnableBankingLinkAction } from "@/actions/institutions/reconnect-enablebanking-link";
import { reconnectGoCardLessLinkAction } from "@/actions/institutions/reconnect-gocardless-link";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useScript } from "@uidotdev/usehooks";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type Props = {
  id: string;
  provider: string;
  enrollmentId: string | null;
  institutionId: string;
  accessToken: string | null;
  onManualSync: () => void;
  variant?: "button" | "icon";
};

export function ReconnectProvider({
  id,
  provider,
  enrollmentId,
  institutionId,
  accessToken,
  onManualSync,
  variant,
}: Props) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [plaidToken, setPlaidToken] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const reconnectGoCardLessLink = useAction(reconnectGoCardLessLinkAction, {
    onExecute: () => {
      setIsLoading(true);
    },
    onError: () => {
      setIsLoading(false);

      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
    onSuccess: () => {
      setIsLoading(false);
    },
  });

  const reconnectEnableBankingLink = useAction(
    reconnectEnableBankingLinkAction,
    {
      onExecute: () => {
        setIsLoading(true);
      },
      onError: () => {
        setIsLoading(false);

        toast({
          duration: 2500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  );

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
      onManualSync();
    },
    onExit: () => {
      setPlaidToken(undefined);
    },
  });

  const openTeller = () => {
    const teller = window.TellerConnect.setup({
      applicationId: process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID!,
      environment: process.env.NEXT_PUBLIC_TELLER_ENVIRONMENT,
      enrollmentId,
      appearance: theme,
      onSuccess: () => {
        onManualSync();
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
        const token = await createPlaidLinkTokenAction(
          accessToken ?? undefined,
        );

        if (token) {
          setPlaidToken(token);
        }

        return;
      }
      case "gocardless": {
        return reconnectGoCardLessLink.execute({
          id,
          institutionId,
          availableHistory: 60,
          redirectTo: `${window.location.origin}/api/gocardless/reconnect`,
          isDesktop: isDesktopApp(),
        });
      }
      case "enablebanking": {
        return reconnectEnableBankingLink.execute({
          institutionId,
          isDesktop: isDesktopApp(),
        });
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
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          "Reconnect"
        )}
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
              <Loader2 className="size-3.5 animate-spin" />
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
