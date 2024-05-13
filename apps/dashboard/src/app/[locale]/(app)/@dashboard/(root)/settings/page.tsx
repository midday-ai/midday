import { DeleteTeam } from "@/components/delete-team";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamName } from "@/components/team-name";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Settings | Midday",
};

export default async function Account() {
  const user = await getUser();

  return (
    <div className="space-y-12">
      <TeamAvatar
        teamId={user?.data?.team?.id}
        name={user?.data?.team?.name}
        logoUrl={user?.data?.team?.logo_url}
      />

      <TeamName name={user?.data?.team?.name} />
      <DeleteTeam name={user?.data?.team?.name} teamId={user?.data?.team?.id} />
    </div>
  );
}
