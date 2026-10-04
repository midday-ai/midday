import { getDb } from "@jobs/init";
import { getTeamById } from "@midday/db/queries";

export async function shouldSendEmail(teamId: string) {
  const team = await getTeamById(getDb(), teamId);
  if (!team) return false;
  return team.plan === "trial" || team.subscriptionStatus === "trialing";
}
