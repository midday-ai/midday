import { getTeamInvites, getTeamUser } from "@midday/supabase/cached-queries";
import { DataTable } from "./table";

export async function PendingInvitesTable() {
  const [teamInvites, user] = await Promise.all([
    getTeamInvites(),
    getTeamUser(),
  ]);

  return <DataTable data={teamInvites?.data} currentUser={user?.data} />;
}
