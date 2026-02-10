"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import { useUserQuery } from "@/hooks/use-user";
import { getTrialDaysLeft, isTrialExpired } from "@/utils/trial";
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
  const daysLeft = getTrialDaysLeft(team.createdAt);

  return (
    <Button
      asChild
      variant="outline"
      className="rounded-full font-normal h-[32px] p-0 px-3 text-xs text-[#878787]"
    >
      <Link href="/upgrade">
        Pro trial - {daysLeft} {daysLeft === 1 ? "day" : "days"} left
      </Link>
    </Button>
  );
}
