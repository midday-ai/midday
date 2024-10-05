import { TeamDropdown } from "@/components/team-dropdown";
import { getTeams, getUser } from "@midday/supabase/cached-queries";
import { ChangeTeamButton } from "./buttons/team/change-team-button";

interface TeamMenuProps {
  mode?: "button" | "dropdown";
}

export async function TeamMenu({ mode = "dropdown" }: TeamMenuProps) {
  const user = await getUser();
  const teams = await getTeams();

  if (mode === "button") {
    return (
      <ChangeTeamButton
        currentTeamId={user?.data?.team?.id}
        teams={teams?.data}
      />
    );
  }

  return (
    <TeamDropdown
      selectedTeamId={user?.data?.team?.id}
      teams={teams?.data}
      key={user?.data?.team?.id}
    />
  );
}
