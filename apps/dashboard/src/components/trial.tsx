import { Cookies } from "@/utils/constants";
import { canChooseStarterPlanQuery, getProPlanPrice } from "@/utils/plans";
import { UTCDate } from "@date-fns/utc";
import { getUser } from "@midday/supabase/cached-queries";
import { addDays, differenceInDays, isSameDay, parseISO } from "date-fns";
import { cookies } from "next/headers";
import { ChoosePlanButton } from "./choose-plan-button";
import { FeedbackForm } from "./feedback-form";

interface Team {
  created_at: string;
  id: string;
  name?: string;
  [key: string]: string | number | boolean | undefined;
}

export async function Trial() {
  const userData = await getUser();

  const team = userData?.data?.team as Team | undefined;

  if (!team) {
    return null;
  }

  if (team.plan !== "trial") {
    return <FeedbackForm />;
  }

  // Parse dates using UTCDate for consistent timezone handling
  const rawCreatedAt = parseISO(team.created_at);
  const today = new UTCDate();

  // Convert to UTCDate for consistent calculation
  const createdAt = new UTCDate(rawCreatedAt);

  // Set trial end date 14 days from creation
  const trialEndDate = addDays(createdAt, 14);

  // If team was created today, show exactly 14 days
  // Otherwise calculate the remaining days
  const daysLeft = isSameDay(createdAt, today)
    ? 14
    : Math.max(0, differenceInDays(trialEndDate, today));

  // Get Pro plan price based on team creation date
  const proPlanPrice = getProPlanPrice(team.created_at);

  // Determine if discount applies
  const hasDiscount = proPlanPrice < 99;
  const discountPrice = hasDiscount ? proPlanPrice : undefined;

  const isTrialEnded = daysLeft <= 0;

  // If the team was created before March 1st 2025, don't show the trial
  if (new Date(team.created_at) < new Date("2025-03-01")) {
    return null;
  }

  const canChooseStarterPlan = await canChooseStarterPlanQuery(team.id);

  if (isTrialEnded) {
    const upgradeModalShown = cookies().has(Cookies.UpgradeModalShown);

    return (
      <ChoosePlanButton
        initialIsOpen={!upgradeModalShown}
        daysLeft={daysLeft}
        hasDiscount={hasDiscount}
        discountPrice={discountPrice}
        teamId={team.id}
        canChooseStarterPlan={canChooseStarterPlan}
      >
        Upgrade plan
      </ChoosePlanButton>
    );
  }

  return (
    <ChoosePlanButton
      hasDiscount={hasDiscount}
      discountPrice={discountPrice}
      daysLeft={daysLeft}
      teamId={team.id}
      canChooseStarterPlan={canChooseStarterPlan}
    >
      Pro trial - {daysLeft} days left
    </ChoosePlanButton>
  );
}
