import { subDays } from "date-fns";

export interface TeamEligibilityData {
  plan: "trial" | "starter" | "pro";
  created_at: string;
}

/**
 * Checks if a team is eligible for sync operations based on:
 * 1. Teams with starter or pro plan (always eligible)
 * 2. Trial teams created during beta period (within 14 days of creation)
 */
export function isTeamEligibleForSync(team: TeamEligibilityData): boolean {
  // Pro and starter teams are always eligible
  if (team.plan === "pro" || team.plan === "starter") {
    return true;
  }

  // Trial teams are only eligible if created within the beta period (14 days)
  if (team.plan === "trial") {
    const teamCreatedAt = new Date(team.created_at);
    const fourteenDaysAgo = subDays(new Date(), 14);

    // Team is eligible if created within the last 14 days (inclusive)
    return teamCreatedAt >= fourteenDaysAgo;
  }

  // All other cases are not eligible
  return false;
}
