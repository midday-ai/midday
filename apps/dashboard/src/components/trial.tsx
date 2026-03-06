"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import { useUserQuery } from "@/hooks/use-user";
import { getTrialDaysLeft, isTrialExpired } from "@/utils/trial";

export function Trial() {
  const { data: user } = useUserQuery();

  const team = user?.team;

  if (!team) {
    return null;
  }

  if (team.plan !== "trial") {
    return null;
  }

  if (isTrialExpired(team.createdAt)) {
    return null;
  }

  const daysLeft = getTrialDaysLeft(team.createdAt);

  return (
    <Button
      asChild
      variant="outline"
      className="rounded-full font-normal h-[32px] p-0 px-3 text-xs text-[#878787]"
    >
      <Link href="/upgrade">
        Trial - {daysLeft} {daysLeft === 1 ? "day" : "days"} left
      </Link>
    </Button>
  );
}
