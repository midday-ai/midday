import { subDays } from "date-fns";

export interface TeamEligibilityData {
  plan: "trial" | "starter" | "pro";
  createdAt: string;
}

/**
 * Checks if a team is eligible for sync operations based on:
 * 1. Teams with starter or pro plan (always eligible)
 * 2. Trial teams created during beta period (within 14 days of creation)
 */
export function isTeamEligibleForSync(team: TeamEligibilityData): boolean {
  if (team.plan === "pro" || team.plan === "starter") {
    return true;
  }

  if (team.plan === "trial") {
    const teamCreatedAt = new Date(team.createdAt);
    const fourteenDaysAgo = subDays(new Date(), 14);

    return teamCreatedAt >= fourteenDaysAgo;
  }

  return false;
}
