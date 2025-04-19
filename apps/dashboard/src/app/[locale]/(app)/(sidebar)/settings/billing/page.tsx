import { ManageSubscription } from "@/components/manage-subscription";
import { Plans } from "@/components/plans";
import { trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | Midday",
};

export default async function Billing() {
  const queryClient = getQueryClient();
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  const team = user?.team;

  return (
    <div className="space-y-12">
      {team?.plan !== "trial" && <ManageSubscription />}

      {team?.plan === "trial" && (
        <div>
          <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
            Plans
          </h2>

          <Plans />
        </div>
      )}
    </div>
  );
}
