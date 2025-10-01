import { subDays } from "date-fns";

export interface TeamEligibilityData {
  plan: "trial" | "starter" | "pro";
  created_at: string;
}

/**
 * Checks if a team is eligible for mutations based on:
 * 1. Teams with starter or pro plan (always eligible)
 * 2. Trial teams within 14 days of creation
 * 3. Teams with canceled_at are not eligible (subscription ended)
 */
export function isTeamEligible(
  team: TeamEligibilityData & { canceled_at?: string | null },
): boolean {
  // If subscription was canceled/revoked, not eligible
  if (team.canceled_at) {
    return false;
  }

  // Pro and starter teams are always eligible
  if (team.plan === "pro" || team.plan === "starter") {
    return true;
  }

  // Trial teams are only eligible if created within the last 14 days
  if (team.plan === "trial") {
    const teamCreatedAt = new Date(team.created_at);
    const fourteenDaysAgo = subDays(new Date(), 14);

    // Team is eligible if created within the last 14 days (inclusive)
    return teamCreatedAt >= fourteenDaysAgo;
  }

  // All other cases are not eligible
  return false;
}
