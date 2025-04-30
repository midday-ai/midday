"use client";

import { useTRPC } from "@/trpc/client";
import { getConnectionsStatus } from "@/utils/connection-status";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function ConnectionStatus() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.bankConnections.get.queryOptions({ enabled: true }),
  );

  if (isLoading || !data) {
    return null;
  }

  const connectionIssue = data?.some((bank) => bank.status === "disconnected");

  if (connectionIssue) {
    return (
      <TooltipProvider delayDuration={70}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/settings/accounts" prefetch>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-8 h-8 items-center hidden md:flex"
              >
                <Icons.Error size={16} className="text-[#FF3638]" />
              </Button>
            </Link>
          </TooltipTrigger>

          <TooltipContent
            className="px-3 py-1.5 text-xs max-w-[230px]"
            sideOffset={10}
          >
            There is a connection issue with one of your banks.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // NOTE: No connections with expire_at (Only GoCardLess and Enable Banking)
  if (data?.find((bank) => bank.expires_at === null)) {
    return null;
  }

  const { warning, error, show } = getConnectionsStatus(data);

  if (!show) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={70}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/settings/accounts" prefetch>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8 items-center hidden md:flex"
            >
              <Icons.Error
                size={16}
                className={cn(
                  error && "text-[#FF3638]",
                  warning && "text-[#FFD02B]",
                )}
              />
            </Button>
          </Link>
        </TooltipTrigger>

        <TooltipContent
          className="px-3 py-1.5 text-xs max-w-[230px]"
          sideOffset={10}
        >
          The connection is expiring soon, update your connection.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
