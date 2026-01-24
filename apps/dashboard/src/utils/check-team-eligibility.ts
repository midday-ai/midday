import { subDays } from "date-fns";

export interface TeamEligibilityData {
  plan: "trial" | "starter" | "pro";
  created_at: string;
}

/**
 * Checks if a team is eligible for sync operations based on:
 * 1. Teams with starter or pro plan (always eligible)
 * 2. Trial teams created during beta period (within 30 days of creation)
 */
export function isTeamEligibleForSync(team: TeamEligibilityData): boolean {
  // Pro and starter teams are always eligible
  if (team.plan === "pro" || team.plan === "starter") {
    return true;
  }

  // Trial teams are only eligible if created within the beta period (30 days)
  if (team.plan === "trial") {
    const teamCreatedAt = new Date(team.created_at);
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Team is eligible if created within the last 30 days (inclusive)
    return teamCreatedAt >= thirtyDaysAgo;
  }

  // All other cases are not eligible
  return false;
}
