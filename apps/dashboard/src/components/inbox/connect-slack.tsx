"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAppOAuth } from "@/hooks/use-app-oauth";
import { useTRPC } from "@/trpc/client";

export function ConnectSlack() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCode, setLinkCode] = useState("");

  const { data: installedApps } = useQuery(trpc.apps.get.queryOptions());
  const isInstalled =
    installedApps?.some((app) => app.app_id === "slack") ?? false;

  const createLinkTokenMutation = useMutation(
    trpc.apps.createPlatformLinkToken.mutationOptions({
      onSuccess: (token) => {
        setLinkCode(token.code);
      },
    }),
  );

  const { connect, isLoading } = useAppOAuth({
    installUrlEndpoint: "/apps/slack/install-url",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.apps.get.queryKey() });
    },
  });

  useEffect(() => {
    if (!open || !isInstalled) {
      return;
    }

    createLinkTokenMutation.mutate({ provider: "slack" });
  }, [open, isInstalled]);

  const linkMessage = linkCode ? `Connect to Midday: ${linkCode}` : "";

  const copyToClipboard = async () => {
    if (!linkMessage) {
      return;
    }

    await navigator.clipboard.writeText(linkMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setLinkCode("");
          setCopied(false);
          createLinkTokenMutation.reset();
        }
      }}
    >
      {isInstalled ? (
        <DialogTrigger asChild>
          <Button
            className="px-6 py-4 w-full font-medium h-[40px]"
            variant="outline"
          >
            <div className="flex items-center space-x-2">
              <Icons.Slack className="size-5" />
              <span>Link Slack User</span>
            </div>
          </Button>
        </DialogTrigger>
      ) : (
        <Button
          className="px-6 py-4 w-full font-medium h-[40px]"
          variant="outline"
          onClick={connect}
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Spinner className="size-5 animate-spin" />
            ) : (
              <Icons.Slack className="size-5" />
            )}
            <span>Connect Slack</span>
          </div>
        </Button>
      )}

      <DialogContent className="sm:max-w-[400px] p-0" hideClose>
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Link Your Slack User</DialogTitle>
            <DialogDescription>
              Open a DM with the Midday bot in Slack and send the one-time code
              below to link your Slack identity.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="w-full rounded-md border p-4 text-sm text-center">
            {createLinkTokenMutation.isError ? (
              <span className="text-destructive">
                Failed to generate link code.
              </span>
            ) : linkMessage ? (
              linkMessage
            ) : (
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <Spinner className="size-4 animate-spin" />
                Generating link code...
              </span>
            )}
          </div>

          <Button
            onClick={
              createLinkTokenMutation.isError
                ? () => createLinkTokenMutation.mutate({ provider: "slack" })
                : copyToClipboard
            }
            variant="outline"
            className="w-full"
            disabled={createLinkTokenMutation.isPending}
          >
            {createLinkTokenMutation.isError ? (
              "Retry"
            ) : copied ? (
              <>
                <Icons.Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Icons.Copy className="mr-2 h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>

          <p className="text-xs text-[#878787] text-center">
            This links your Slack user to your current Midday user. Workspace
            installation and disconnect still live in the Slack app settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
