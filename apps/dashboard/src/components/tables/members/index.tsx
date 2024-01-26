import { getTeamMembers, getTeamUser } from "@midday/supabase/cached-queries";
import { DataTable } from "./table";

export async function MembersTable() {
  const [user, teamMembers] = await Promise.all([
    getTeamUser(),
    getTeamMembers(),
  ]);

  return <DataTable data={teamMembers?.data} currentUser={user?.data} />;
}
