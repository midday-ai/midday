import { TeamDropdown } from "@/components/team-dropdown";
import { getTeams, getUser } from "@midday/supabase/cached-queries";

export async function TeamMenu() {
  const user = await getUser();
  const teams = await getTeams();

  return (
    <TeamDropdown
      selectedTeamId={user?.data?.team?.id}
      teams={teams?.data}
      key={user?.data?.team?.id}
    />
  );
}
