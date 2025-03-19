import { ManageSubscription } from "@/components/manage-subscription";
import { Plans } from "@/components/plans";
import { UsageSkeleton } from "@/components/usage";
import { UsageServer } from "@/components/usage.server";
// import { UsageSkeleton } from "@/components/usage";
// import { UsageServer } from "@/components/usage.server";
import { canChooseStarterPlanQuery, getProPlanPrice } from "@/utils/plans";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";
import { Suspense } from "react";
// import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Billing | Midday",
};

export default async function Billing() {
  const user = await getUser();

  const team = user?.data?.team;
  const canChooseStarterPlan = await canChooseStarterPlanQuery(team?.id);

  const proPlanPrice = getProPlanPrice(team?.created_at);

  // Determine if discount applies
  const hasDiscount = proPlanPrice < 99;
  const discountPrice = hasDiscount ? proPlanPrice : undefined;

  return (
    <div className="space-y-12">
      {team?.plan !== "trial" && <ManageSubscription teamId={team?.id} />}

      {team?.plan === "trial" && (
        <div>
          <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
            Plans
          </h2>

          <Plans
            discountPrice={discountPrice}
            teamId={team?.id}
            canChooseStarterPlan={canChooseStarterPlan}
          />
        </div>
      )}

      <Suspense fallback={<UsageSkeleton />}>
        <UsageServer teamId={team?.id} plan={team?.plan} />
      </Suspense>
    </div>
  );
}
