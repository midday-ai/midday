"use client";

import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppOAuth } from "@/hooks/use-app-oauth";
import { useTRPC } from "@/trpc/client";

export function ConnectSlack() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Check if Slack is installed
  const { data: installedApps } = useQuery(trpc.apps.get.queryOptions());
  const isInstalled =
    installedApps?.some((app) => app.app_id === "slack") ?? false;

  const disconnectMutation = useMutation(
    trpc.apps.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.apps.get.queryKey() });
      },
    }),
  );

  const { connect, isLoading } = useAppOAuth({
    installUrlEndpoint: "/apps/slack/install-url",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.apps.get.queryKey() });
    },
  });

  const handleDisconnect = () => {
    disconnectMutation.mutate({ appId: "slack" });
  };

  return (
    <SubmitButton
      className="px-6 py-4 w-full font-medium h-[40px]"
      variant="outline"
      onClick={isInstalled ? handleDisconnect : connect}
      isSubmitting={isLoading || disconnectMutation.isPending}
    >
      <div className="flex items-center space-x-2">
        <Icons.Slack className="size-5" />
        <span>{isInstalled ? "Disconnect Slack" : "Connect Slack"}</span>
      </div>
    </SubmitButton>
  );
}
