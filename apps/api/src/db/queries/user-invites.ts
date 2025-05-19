import type { Database } from "@api/db";
import { teams, userInvites, usersOnTeam } from "@api/db/schema";
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
        },
      },
    },
  });
}

type DeleteTeamInviteParams = {
  teamId: string;
  inviteId: string;
};

export async function deleteTeamInvite(
  db: Database,
  params: DeleteTeamInviteParams,
) {
  const { teamId, inviteId } = params;

  const [deleted] = await db
    .delete(userInvites)
    .where(and(eq(userInvites.id, inviteId), eq(userInvites.teamId, teamId)))
    .returning();

  return deleted;
}

type CreateTeamInvitesParams = {
  teamId: string;
  invites: {
    email: string;
    role: "owner" | "member";
    invited_by: string;
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
            invitedBy: invite.invited_by,
            teamId: teamId,
          })
          .onConflictDoUpdate({
            target: [userInvites.email, userInvites.teamId],
            set: {
              role: invite.role,
              invitedBy: invite.invited_by,
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
