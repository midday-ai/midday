import { canChooseStarterPlanQuery, getProPlanPrice } from "@/utils/plans";
import { TrialEndedModal } from "./modals/trial-ended-modal";

interface TrialEndedProps {
  createdAt: string;
  plan: string;
  teamId: string;
}

export async function TrialEnded({ createdAt, plan, teamId }: TrialEndedProps) {
  const canChooseStarterPlan = await canChooseStarterPlanQuery(teamId);

  // Get Pro plan price based on team creation date
  const proPlanPrice = getProPlanPrice(createdAt);

  // Determine if discount applies
  const hasDiscount = proPlanPrice < 99;
  const discountPrice = hasDiscount ? proPlanPrice : undefined;

  return (
    <TrialEndedModal
      createdAt={createdAt}
      plan={plan}
      teamId={teamId}
      discountPrice={discountPrice}
      canChooseStarterPlan={canChooseStarterPlan}
    />
  );
}
