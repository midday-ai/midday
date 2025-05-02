"use client";

import { manualSyncTransactionsAction } from "@/actions/transactions/manual-sync-transactions-action";
import { reconnectConnectionAction } from "@/actions/transactions/reconnect-connection-action";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { connectionStatus } from "@/utils/connection-status";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { useSuspenseQuery } from "@tanstack/react-query";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { BankAccount } from "./bank-account";
import { BankLogo } from "./bank-logo";
import { DeleteConnection } from "./delete-connection";
import { ReconnectProvider } from "./reconnect-provider";
import { SyncTransactions } from "./sync-transactions";

function getProviderName(provider: string | null) {
  switch (provider) {
    case "gocardless":
      return "GoCardLess";
    case "enablebanking":
      return "Enable Banking";
    case "teller":
      return "Teller";
    case "plaid":
      return "Plaid";
    default:
      return null;
  }
}

type BankConnection = NonNullable<
  RouterOutputs["bankConnections"]["get"]
>[number];

function ConnectionState({
  connection,
  isSyncing,
}: { connection: BankConnection; isSyncing: boolean }) {
  const { show, expired } = connectionStatus(connection);

  if (isSyncing) {
    return (
      <div className="text-xs font-normal flex items-center space-x-1">
        <span>Syncing...</span>
      </div>
    );
  }

  if (connection.status === "disconnected") {
    return (
      <>
        <div className="text-xs font-normal flex items-center space-x-1 text-[#c33839]">
          <Icons.AlertCircle />
          <span>Connection issue</span>
        </div>

        <TooltipContent
          className="px-3 py-1.5 text-xs max-w-[430px]"
          sideOffset={20}
          side="left"
        >
          Please reconnect to restore the connection to a good state.
        </TooltipContent>
      </>
    );
  }

  if (show) {
    return (
      <>
        <div className="text-xs font-normal flex items-center space-x-1 text-[#FFD02B]">
          <Icons.AlertCircle />
          <span>Connection expires soon</span>
        </div>

        {connection.expires_at && (
          <TooltipContent
            className="px-3 py-1.5 text-xs max-w-[430px]"
            sideOffset={20}
            side="left"
          >
            We only have access to your bank for another{" "}
            {differenceInDays(new Date(connection.expires_at), new Date())}{" "}
            days. Please update the connection to keep everything in sync.
          </TooltipContent>
        )}
      </>
    );
  }

  if (expired) {
    return (
      <div className="text-xs font-normal flex items-center space-x-1 text-[#c33839]">
        <Icons.Error />
        <span>Connection expired</span>
      </div>
    );
  }

  if (connection.last_accessed) {
    return (
      <div className="text-xs font-normal flex items-center space-x-1">
        <span className="text-xs font-normal">{`Updated ${formatDistanceToNow(
          new Date(connection.last_accessed),
          {
            addSuffix: true,
          },
        )}`}</span>
        <span>via {getProviderName(connection.provider)}</span>
      </div>
    );
  }

  return <div className="text-xs font-normal">Never accessed</div>;
}

export function BankConnection({ connection }: { connection: BankConnection }) {
  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [isSyncing, setSyncing] = useState(false);
  const { toast, dismiss } = useToast();
  const router = useRouter();

  const { show } = connectionStatus(connection);
  const { status, setStatus } = useSyncStatus({ runId, accessToken });

  const [params] = useQueryStates({
    step: parseAsString,
    id: parseAsString,
  });

  const manualSyncTransactions = useAction(manualSyncTransactionsAction, {
    onExecute: () => setSyncing(true),
    onSuccess: ({ data }) => {
      if (data) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
      }
    },
    onError: () => {
      setSyncing(false);
      setRunId(undefined);
      setStatus("FAILED");

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  const reconnectConnection = useAction(reconnectConnectionAction, {
    onExecute: () => setSyncing(true),
    onSuccess: ({ data }) => {
      if (data) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
      }
    },
    onError: () => {
      setSyncing(false);
      setRunId(undefined);
      setStatus("FAILED");

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  useEffect(() => {
    if (isSyncing) {
      toast({
        title: "Syncing...",
        description: "We're connecting to your bank, please wait.",
        duration: Number.POSITIVE_INFINITY,
        variant: "spinner",
      });
    }
  }, [isSyncing]);

  useEffect(() => {
    if (status === "COMPLETED") {
      dismiss();
      setRunId(undefined);
      setSyncing(false);
      router.replace("/settings/accounts");
      router.refresh();
    }
  }, [status]);

  useEffect(() => {
    if (status === "FAILED") {
      setSyncing(false);
      setRunId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    }
  }, [status]);

  // NOTE: GoCardLess reconnect flow (redirect from API route)
  useEffect(() => {
    if (params.step === "reconnect" && params.id) {
      reconnectConnection.execute({
        connectionId: params.id,
        provider: connection.provider,
      });
    }
  }, [params]);

  const handleManualSync = () => {
    manualSyncTransactions.execute({
      connectionId: connection.id,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <AccordionTrigger
          className="justify-start text-start w-full"
          chevronBefore
        >
          <div className="flex space-x-4 items-center ml-4 w-full">
            <BankLogo src={connection.logo_url} alt={connection.name} />

            <div className="flex flex-col">
              <span className="text-sm">{connection.name}</span>

              <TooltipProvider delayDuration={70}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ConnectionState
                        connection={connection}
                        isSyncing={isSyncing}
                      />
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </AccordionTrigger>

        <div className="ml-auto flex space-x-2">
          {connection.status === "disconnected" || show ? (
            <>
              <ReconnectProvider
                variant="button"
                id={connection.id}
                provider={connection.provider}
                enrollmentId={connection.enrollment_id}
                institutionId={connection.institution_id}
                accessToken={connection.access_token}
                onManualSync={handleManualSync}
                referenceId={connection.reference_id}
              />
              <DeleteConnection connectionId={connection.id} />
            </>
          ) : (
            <>
              <ReconnectProvider
                id={connection.id}
                provider={connection.provider}
                enrollmentId={connection.enrollment_id}
                institutionId={connection.institution_id}
                accessToken={connection.access_token}
                onManualSync={handleManualSync}
                referenceId={connection.reference_id}
              />
              <SyncTransactions
                disabled={isSyncing}
                onClick={handleManualSync}
              />
              <DeleteConnection connectionId={connection.id} />
            </>
          )}
        </div>
      </div>

      <AccordionContent className="bg-background">
        <div className="ml-[30px] divide-y">
          {connection.accounts.map((account) => {
            return <BankAccount key={account.id} data={account} />;
          })}
        </div>
      </AccordionContent>
    </div>
  );
}

export function BankConnections() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.bankConnections.get.queryOptions());
  const defaultValue = data?.length === 1 ? ["connection-0"] : undefined;

  return (
    <div className="px-6 divide-y">
      <Accordion type="multiple" className="w-full" defaultValue={defaultValue}>
        {data?.map((connection, index) => {
          return (
            <AccordionItem
              value={`connection-${index}`}
              key={connection.id}
              className="border-none"
            >
              <BankConnection connection={connection} />
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
