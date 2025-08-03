import { getDb } from "@jobs/init";
import { getTeamById } from "@midday/db/queries";

export async function shouldSendEmail(teamId: string) {
  const db = getDb();

  const team = await getTeamById(db, teamId);

  return team?.plan === "trial";
}
