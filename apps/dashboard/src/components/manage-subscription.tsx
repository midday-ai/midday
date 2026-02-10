"use client";

import { getPlanName } from "@midday/plans";
import { Card } from "@midday/ui/card";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";

export function ManageSubscription() {
  const trpc = useTRPC();
  const { data: team } = useTeamQuery();

  const getPortalUrlMutation = useMutation(
    trpc.billing.getPortalUrl.mutationOptions({
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
    }),
  );

  return (
    <div>
      <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
        Subscription
      </h2>

      <Card className="flex justify-between p-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="text-lg font-medium">{getPlanName(team?.plan)}</p>
        </div>

        <div className="mt-auto">
          <SubmitButton
            variant="secondary"
            className="h-9 hover:bg-primary hover:text-secondary"
            isSubmitting={getPortalUrlMutation.isPending}
            onClick={() => getPortalUrlMutation.mutate()}
          >
            Manage subscription
          </SubmitButton>
        </div>
      </Card>
    </div>
  );
}
