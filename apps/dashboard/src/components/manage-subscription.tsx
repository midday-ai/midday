"use client";

import { getPlanName } from "@midday/plans";
import { Card } from "@midday/ui/card";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { CancellationDialog } from "./cancellation-dialog";

export function ManageSubscription() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();
  const { data: user } = useUserQuery();
  const [cancelOpen, setCancelOpen] = useState(false);

  const queryClient = useQueryClient();
  const isCanceling = !!user?.team?.canceledAt;

  const getPortalUrlMutation = useMutation(
    trpc.billing.getPortalUrl.mutationOptions({
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
    }),
  );

  const reactivateMutation = useMutation(
    trpc.billing.reactivateSubscription.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        });
      },
    }),
  );

  return (
    <div>
      <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
        Subscription
      </h2>

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-lg font-medium">{getPlanName(team?.plan)}</p>
          </div>

          <div className="mt-auto">
            {isCanceling ? (
              <SubmitButton
                variant="secondary"
                className="h-9 hover:bg-primary hover:text-secondary"
                isSubmitting={reactivateMutation.isPending}
                onClick={() => reactivateMutation.mutate()}
              >
                Reactivate subscription
              </SubmitButton>
            ) : (
              <SubmitButton
                variant="secondary"
                className="h-9 hover:bg-primary hover:text-secondary"
                isSubmitting={getPortalUrlMutation.isPending}
                onClick={() => getPortalUrlMutation.mutate()}
              >
                Manage subscription
              </SubmitButton>
            )}
          </div>
        </div>

        {!isCanceling && (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="text-xs text-[#878787] hover:text-foreground transition-colors text-left"
          >
            Cancel subscription
          </button>
        )}

        {isCanceling && (
          <p className="text-xs text-[#878787]">
            Your subscription has been canceled and will end at the end of your
            billing period.
          </p>
        )}
      </Card>

      <CancellationDialog open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  );
}
