import { addYears } from "date-fns";
import { cookies } from "next/headers";

export const selectedTeamIdCookieName = "selected-team-id";

export async function getTeamId() {
  const cookieStore = await cookies();
  const teamId = cookieStore.get(selectedTeamIdCookieName)?.value;

  return teamId;
}

export async function setTeamId(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set(selectedTeamIdCookieName, teamId, {
    expires: addYears(new Date(), 100),
  });
}

export async function deleteTeamId() {
  const cookieStore = await cookies();
  cookieStore.delete(selectedTeamIdCookieName);
}
