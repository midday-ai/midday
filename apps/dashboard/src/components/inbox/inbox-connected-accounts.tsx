"use client";

import { useSyncStatus } from "@/hooks/use-sync-status";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { DeleteInboxAccount } from "./delete-inbox-account";
import { InboxAccountsListSkeleton } from "./inbox-connected-accounts-skeleton";
import { SyncInboxAccount } from "./sync-inbox-account";

type InboxAccount = NonNullable<RouterOutputs["inboxAccounts"]["get"]>[number];

function InboxAccountItem({ account }: { account: InboxAccount }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [isSyncing, setSyncing] = useState(false);
  const { toast, dismiss } = useToast();
  const router = useRouter();

  const { status, setStatus, result } = useSyncStatus({ runId, accessToken });

  const syncInboxAccountMutation = useMutation(
    trpc.inboxAccounts.sync.mutationOptions({
      onMutate: () => {
        setSyncing(true);
      },
      onSuccess: (data) => {
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
    }),
  );

  useEffect(() => {
    if (isSyncing) {
      toast({
        title: "Syncing...",
        description:
          "We're scanning for PDF attachments and receipts, please wait.",
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

      // Show success toast with attachment count
      const attachmentCount = result?.attachmentsProcessed || 0;
      const description =
        attachmentCount > 0
          ? `Found ${attachmentCount} new ${attachmentCount === 1 ? "attachment" : "attachments"}.`
          : "No new attachments found.";

      toast({
        title: "Sync completed successfully",
        description,
        variant: "success",
        duration: 3500,
      });

      queryClient.invalidateQueries({
        queryKey: trpc.inboxAccounts.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.inbox.get.queryKey(),
      });
    }
  }, [status]);

  useEffect(() => {
    if (status === "FAILED") {
      setSyncing(false);
      setRunId(undefined);

      queryClient.invalidateQueries({
        queryKey: trpc.inboxAccounts.get.queryKey(),
      });

      toast({
        duration: 3500,
        variant: "error",
        title: "Inbox sync failed, please try again.",
      });
    }
  }, [status]);

  const handleManualSync = () => {
    syncInboxAccountMutation.mutate({
      id: account.id,
      manualSync: true,
    });
  };

  const connectMutation = useMutation(
    trpc.inboxAccounts.connect.mutationOptions({
      onSuccess: (authUrl) => {
        if (authUrl) {
          router.push(authUrl);
        }
      },
    }),
  );

  const isDisconnected = account.status === "disconnected";

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        <Avatar className="size-[34px]">
          <AvatarFallback className="bg-white border border-border">
            <Icons.Gmail className="size-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{account.email}</span>
            {isDisconnected && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Badge variant="tag-rounded" className="text-xs cursor-help">
                    Disconnected
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] text-xs">
                  <p>
                    Account access has expired. Google typically expires access
                    tokens after 6 months as part of their security practices.
                    Simply reconnect to restore functionality.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {isSyncing ? (
              "Syncing..."
            ) : (
              <>
                Last accessed{" "}
                {formatDistanceToNow(new Date(account.lastAccessed))} ago
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex space-x-2 items-center">
        {isDisconnected ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => connectMutation.mutate({ provider: "gmail" })}
            className="text-xs"
          >
            Reconnect
          </Button>
        ) : (
          <SyncInboxAccount
            disabled={isSyncing || syncInboxAccountMutation.isPending}
            onClick={handleManualSync}
          />
        )}
        <DeleteInboxAccount accountId={account.id} />
      </div>
    </div>
  );
}

function InboxAccountsList() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.inboxAccounts.get.queryOptions());

  if (!data?.length) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          No inbox connections found.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 divide-y">
      {data.map((account) => (
        <InboxAccountItem key={account.id} account={account} />
      ))}
    </div>
  );
}

export function InboxConnectedAccounts() {
  const trpc = useTRPC();
  const router = useRouter();

  const connectMutation = useMutation(
    trpc.inboxAccounts.connect.mutationOptions({
      onSuccess: (authUrl: string | null) => {
        if (authUrl) {
          router.push(authUrl);
        }
      },
    }),
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Email Connections</span>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="rounded-full text-[#878787] text-[9px] font-normal border px-2 py-1 font-mono cursor-help">
                  Beta
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs">
                <p>
                  We are currently in Google's verification review process. This
                  is a standard procedure for all apps requesting Gmail access.
                  You may see a warning screen - this is normal. Simply click{" "}
                  <strong>Advanced</strong> →{" "}
                  <strong>Go to midday.ai (unsafe)</strong> to safely proceed.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Manage your connected email accounts or connect a new one.
          </CardDescription>
        </CardHeader>

        <Suspense fallback={<InboxAccountsListSkeleton />}>
          <InboxAccountsList />
        </Suspense>

        <CardFooter className="flex justify-between">
          <div />

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => connectMutation.mutate({ provider: "gmail" })}
                disabled={connectMutation.isPending}
                data-event="Connect email"
                data-channel="email"
              >
                Connect email
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px] text-xs">
              <p>
                We are currently in Google's verification review process. This
                is a standard procedure for all apps requesting Gmail access.
                You may see a warning screen - this is normal. Simply click{" "}
                <strong>Advanced</strong> →{" "}
                <strong>Go to midday.ai (unsafe)</strong> to safely proceed.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
