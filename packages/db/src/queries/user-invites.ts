import type { Database } from "@db/client";
import { teams, userInvites, usersOnTeam } from "@db/schema";
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
          logoUrl: true,
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
  id: string;
  userId: string;
};

export async function acceptTeamInvite(
  db: Database,
  params: AcceptTeamInviteParams,
) {
  const inviteData = await db.query.userInvites.findFirst({
    where: and(eq(userInvites.id, params.id)),
    columns: {
      id: true,
      role: true,
      teamId: true,
    },
  });

  if (!inviteData) {
    throw new Error("Invite not found");
  }

  await db.transaction(async (tx) => {
    await tx.insert(usersOnTeam).values({
      userId: params.userId,
      role: inviteData.role,
      teamId: inviteData.teamId!,
    });

    // Delete the invite
    await tx.delete(userInvites).where(eq(userInvites.id, inviteData.id));
  });

  return inviteData;
}

type DeclineTeamInviteParams = {
  id: string;
  email: string;
};

export async function declineTeamInvite(
  db: Database,
  params: DeclineTeamInviteParams,
) {
  const { id, email } = params;

  return db
    .delete(userInvites)
    .where(and(eq(userInvites.id, id), eq(userInvites.email, email)));
}

export async function getTeamInvites(db: Database, teamId: string) {
  return db.query.userInvites.findMany({
    where: eq(userInvites.teamId, teamId),
    columns: {
      id: true,
      email: true,
      code: true,
      role: true,
    },
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
          logoUrl: true,
        },
      },
    },
  });
}

export async function getInvitesByEmail(db: Database, email: string) {
  return db.query.userInvites.findMany({
    where: eq(userInvites.email, email),
    columns: {
      id: true,
      email: true,
      code: true,
      role: true,
    },
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
          logoUrl: true,
        },
      },
    },
  });
}

type DeleteTeamInviteParams = {
  id: string;
  teamId: string;
};

export async function deleteTeamInvite(
  db: Database,
  params: DeleteTeamInviteParams,
) {
  const { id, teamId } = params;

  const [deleted] = await db
    .delete(userInvites)
    .where(and(eq(userInvites.id, id), eq(userInvites.teamId, teamId)))
    .returning();

  return deleted;
}

type CreateTeamInvitesParams = {
  teamId: string;
  invites: {
    email: string;
    role: "owner" | "member";
    invitedBy: string;
  }[];
};

export async function createTeamInvites(
  db: Database,
  params: CreateTeamInvitesParams,
) {
  const { teamId, invites } = params;

  return db.transaction(async (tx) => {
    const results = await Promise.all(
      invites.map(async (invite) => {
        // Upsert invite
        const [row] = await tx
          .insert(userInvites)
          .values({
            email: invite.email,
            role: invite.role,
            invitedBy: invite.invitedBy,
            teamId: teamId,
          })
          .onConflictDoUpdate({
            target: [userInvites.email, userInvites.teamId],
            set: {
              role: invite.role,
              invitedBy: invite.invitedBy,
            },
          })
          .returning({
            id: userInvites.id,
            email: userInvites.email,
            code: userInvites.code,
            role: userInvites.role,
            invitedBy: userInvites.invitedBy,
            teamId: userInvites.teamId,
          });

        if (!row) return null;

        // Fetch team
        const team = await tx.query.teams.findFirst({
          where: eq(teams.id, teamId),
          columns: {
            id: true,
            name: true,
          },
        });

        return {
          email: row.email,
          code: row.code,
          role: row.role,
          team,
        };
      }),
    );

    return results;
  });
}
