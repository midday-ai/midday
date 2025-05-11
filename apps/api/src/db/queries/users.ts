import type { Database } from "@api/db";
import { teams, users } from "@api/db/schema";
import { eq } from "drizzle-orm";

type GetUserByIdParams = {
  id: string;
};

export const getUserById = async (db: Database, { id }: GetUserByIdParams) => {
  const [result] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      timeFormat: users.timeFormat,
      dateFormat: users.dateFormat,
      weekStartsOnMonday: users.weekStartsOnMonday,
      timezone: users.timezone,
      teamId: users.teamId,
      team: {
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        email: teams.email,
        inboxEmail: teams.inboxEmail,
        plan: teams.plan,
      },
    })
    .from(users)
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(eq(users.id, id));

  return result;
};
