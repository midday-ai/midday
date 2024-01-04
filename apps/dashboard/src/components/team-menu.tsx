import { TeamDropdown } from "@/components/team-dropdown";
import { getTeams, getUser } from "@midday/supabase/cached-queries";

export async function TeamMenu() {
  const { data: userData } = await getUser();
  const { data: teamsData } = await getTeams();

  return <TeamDropdown selectedTeamId={userData?.team?.id} teams={teamsData} />;
}
