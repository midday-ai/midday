import { TeamsTable } from "@/components/tables/teams/table";
import { getTeams, getUserInvites } from "@midday/supabase/cached-queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams | Midday",
};

export default async function Teams() {
  const { data: teamsData } = await getTeams();
  const { data: invitesData } = await getUserInvites();

  return (
    <div className="space-y-12">
      <TeamsTable
        data={[
          ...teamsData,
          ...invitesData.map((invite) => ({ ...invite, isInvite: true })),
        ]}
      />
    </div>
  );
}
