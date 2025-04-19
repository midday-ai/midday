"use client";

import { useUserQuery } from "@/hooks/use-user";
import { UTCDate } from "@date-fns/utc";
import { addDays, differenceInDays, isSameDay, parseISO } from "date-fns";
import { ChoosePlanButton } from "./choose-plan-button";
import { FeedbackForm } from "./feedback-form";

export function Trial() {
  const { data: user } = useUserQuery();

  const team = user?.team;

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

  const daysLeft = isSameDay(createdAt, today)
    ? 14
    : Math.max(0, differenceInDays(trialEndDate, today));

  const isTrialEnded = daysLeft <= 0;

  const canChooseStarterPlan = true;
  const targetDate = new UTCDate("2025-04-16");

  if (targetDate > today) {
    return (
      <ChoosePlanButton
        initialIsOpen={false}
        daysLeft={daysLeft}
        hasDiscount
        discountPrice={49}
        teamId={team.id}
        canChooseStarterPlan={canChooseStarterPlan}
      >
        Pro trial - {daysLeft} {daysLeft === 1 ? "day" : "days"} left
      </ChoosePlanButton>
    );
  }

  if (isTrialEnded) {
    return (
      <ChoosePlanButton
        initialIsOpen={false}
        daysLeft={daysLeft}
        hasDiscount
        discountPrice={49}
        teamId={team.id}
        canChooseStarterPlan={canChooseStarterPlan}
      >
        Upgrade plan
      </ChoosePlanButton>
    );
  }

  return (
    <ChoosePlanButton
      hasDiscount
      discountPrice={49}
      daysLeft={daysLeft}
      teamId={team.id}
      canChooseStarterPlan={canChooseStarterPlan}
    >
      Pro trial - {daysLeft} {daysLeft === 1 ? "day" : "days"} left
    </ChoosePlanButton>
  );
}
