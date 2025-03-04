import { UTCDate } from "@date-fns/utc";
import { getUser } from "@midday/supabase/cached-queries";
import {
  addDays,
  differenceInDays,
  differenceInMonths,
  isFuture,
  isSameDay,
  parseISO,
} from "date-fns";
import { ChoosePlanButton } from "./choose-plan-button";

interface Team {
  created_at: string;
  id: string;
  name?: string;
  [key: string]: string | number | boolean | undefined; // More specific index signature
}

export async function Trail() {
  const userData = await getUser();

  const team = userData?.data?.team as Team | undefined;

  if (!team) {
    return null;
  }

  // Parse dates using UTCDate for consistent timezone handling
  const rawCreatedAt = parseISO(team.created_at);
  const today = new UTCDate();

  // If the creation date is in the future, don't display the trial
  if (isFuture(rawCreatedAt)) {
    return null;
  }

  // Convert to UTCDate for consistent calculation
  const createdAt = new UTCDate(rawCreatedAt);

  // Set trial end date 14 days from creation
  const trialEndDate = addDays(createdAt, 14);

  // If team was created today, show exactly 14 days
  // Otherwise calculate the remaining days
  const daysLeft = isSameDay(createdAt, today)
    ? 14
    : Math.max(0, differenceInDays(trialEndDate, today));

  // Calculate months since team creation
  const monthsSinceCreation = differenceInMonths(today, createdAt);

  // Determine if discount applies and calculate discount price
  let hasDiscount = false;
  let discountPrice: number | undefined;

  if (monthsSinceCreation > 8) {
    // Teams created over 8 months ago get the Pro plan for $30
    hasDiscount = true;
    discountPrice = 30;
  } else if (monthsSinceCreation > 0) {
    // Teams registered before today get Pro plan for $49 minus months since creation
    hasDiscount = true;
    discountPrice = Math.max(49 - monthsSinceCreation, 30);
  }

  const isTrialEnded = daysLeft <= 0;

  // If the team was created before March 1st 2025, don't show the trial
  if (new Date(team.created_at) < new Date("2025-03-01")) {
    return null;
  }

  // Disable trial for now
  return null;

  if (isTrialEnded) {
    return (
      <ChoosePlanButton
        initialIsOpen={true}
        daysLeft={daysLeft}
        hasDiscount={hasDiscount}
        discountPrice={discountPrice}
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
    >
      Pro trial - {daysLeft} days left
    </ChoosePlanButton>
  );
}
