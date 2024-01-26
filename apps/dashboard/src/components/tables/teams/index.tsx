import { getTeams, getUserInvites } from "@midday/supabase/cached-queries";
import { DataTable } from "./table";

export async function TeamsTable() {
  const [teams, invites] = await Promise.all([getTeams(), getUserInvites()]);

  return (
    <DataTable
      data={[
        ...teams?.data,
        ...invites?.data?.map((invite) => ({ ...invite, isInvite: true })),
      ]}
    />
  );
}
