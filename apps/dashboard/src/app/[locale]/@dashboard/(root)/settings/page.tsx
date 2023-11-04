import { DeleteTeam } from "@/components/delete-team";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamName } from "@/components/team-name";
import { getCachedCurrentUser } from "@midday/supabase/cached-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Settings | Midday",
};

export default async function Account() {
  const { data: userData } = await getCachedCurrentUser();

  return (
    <div className="flex flex-col space-y-12">
      <TeamAvatar
        teamId={userData.team.id}
        name={userData.team.name}
        logoUrl={userData?.team?.logo_url}
      />
      <TeamName name={userData.team.name} />
      <DeleteTeam name={userData.team.name} />
    </div>
  );
}
