import type { Database } from "@midday/db/client";
/** Resolve the selected team from server state and require current membership. */
export async function resolveRealtimeTeam(
  db: Pick<Database, "query">,
  userId: string,
): Promise<string | null> {
  const user = await db.query.users.findFirst({
    columns: { teamId: true },
    with: { usersOnTeams: { columns: { teamId: true } } },
    where: (users, { eq }) => eq(users.id, userId),
  });
  if (
    !user?.teamId ||
    !user.usersOnTeams.some((membership) => membership.teamId === user.teamId)
  )
    return null;
  return user.teamId;
}
