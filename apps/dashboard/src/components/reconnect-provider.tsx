"use client";

import { createGoCardLessLinkAction } from "@/actions/institutions/create-gocardless-link";
import { createPlaidLinkTokenAction } from "@/actions/institutions/create-plaid-link";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useScript } from "@uidotdev/usehooks";
import { useAction } from "next-safe-action/hooks";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type Props = {
  provider: string;
  enrollmentId: string | null;
  institutionId: string;
  accessToken: string | null;
};

export function ReconnectProvider({
  provider,
  enrollmentId,
  institutionId,
  accessToken,
}: Props) {
  const createGoCardLessLink = useAction(createGoCardLessLinkAction);
  const { theme } = useTheme();

  const [plaidToken, setPlaidToken] = useState<string | undefined>();

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
      onSuccess: (authorization) => {},
      onExit: () => {},
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
        return createGoCardLessLink.execute({
          institutionId,
          step: "reconnect",
          availableHistory: 60,
          redirectBase: isDesktopApp()
            ? "midday://settings/accounts"
            : window.location.origin,
        });
      }
      case "teller":
        return openTeller();
      default:
        return;
    }
  };

  return (
    <TooltipProvider delayDuration={70}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-7 h-7 flex items-center"
            onClick={handleOnClick}
          >
            <Icons.Reconnect size={16} />
          </Button>
        </TooltipTrigger>

        <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
          Reconnect
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
