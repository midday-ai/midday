"use client";

import { useUserQuery } from "@/hooks/use-user";
import { isTrialExpired } from "@/utils/trial";
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

  // Check if trial has expired
  if (isTrialExpired(team.createdAt)) {
    // If trial expired, show feedback form (upgrade content is shown in layout)
    return <FeedbackForm />;
  }

  // Calculate days left for display
  const rawCreatedAt = parseISO(team.createdAt);
  const today = new UTCDate();
  const createdAt = new UTCDate(rawCreatedAt);
  const trialEndDate = addDays(createdAt, 14);
  const daysLeft = isSameDay(createdAt, today)
    ? 14
    : Math.max(0, differenceInDays(trialEndDate, today));

  return (
    <ChoosePlanButton hasDiscount discountPrice={49} daysLeft={daysLeft}>
      Pro trial - {daysLeft} {daysLeft === 1 ? "day" : "days"} left
    </ChoosePlanButton>
  );
}
