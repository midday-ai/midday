import type { Database } from "@api/db";
import { userInvites, usersOnTeam } from "@api/db/schema";
import { and, eq } from "drizzle-orm";

export async function getUserInvites(db: Database, email: string) {
  return db.query.userInvites.findMany({
    where: eq(userInvites.email, email),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      team: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    columns: {
      id: true,
      email: true,
      code: true,
      role: true,
    },
  });
}

type AcceptTeamInviteParams = {
  userId: string;
  email: string;
  teamId: string;
};

export async function acceptTeamInvite(
  db: Database,
  params: AcceptTeamInviteParams,
) {
  const inviteData = await db.query.userInvites.findFirst({
    where: and(
      eq(userInvites.teamId, params.teamId),
      eq(userInvites.email, params.email),
    ),
    columns: {
      id: true,
      role: true,
    },
  });

  if (!inviteData) {
    throw new Error("Invite not found");
  }

  await db.transaction(async (tx) => {
    await tx.insert(usersOnTeam).values({
      userId: params.userId,
      role: inviteData.role,
      teamId: params.teamId,
    });

    // Delete the invite
    await tx.delete(userInvites).where(eq(userInvites.id, inviteData.id));
  });
}

type DeclineTeamInviteParams = {
  email: string;
  teamId: string;
};

export async function declineTeamInvite(
  db: Database,
  params: DeclineTeamInviteParams,
) {
  const { email, teamId } = params;

  return db
    .delete(userInvites)
    .where(and(eq(userInvites.email, email), eq(userInvites.teamId, teamId)));
}
