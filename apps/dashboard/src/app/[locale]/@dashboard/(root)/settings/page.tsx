import { DeleteTeam } from "@/components/delete-team";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamName } from "@/components/team-name";
import { getUserDetails } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Settings | Midday",
};

export default async function Account() {
  const supabase = createClient();
  const { data: userData } = await getUserDetails(supabase);

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
