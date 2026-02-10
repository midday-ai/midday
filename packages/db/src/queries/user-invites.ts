import { and, eq, or, sql } from "drizzle-orm";
import type { Database } from "../client";
import { teams, userInvites, users, usersOnTeam } from "../schema";

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

  await db.insert(usersOnTeam).values({
    userId: params.userId,
    role: inviteData.role,
    teamId: inviteData.teamId!,
  });

  // Delete the invite
  await db.delete(userInvites).where(eq(userInvites.id, inviteData.id));

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

type InviteValidationResult = {
  validInvites: {
    email: string;
    role: "owner" | "member";
    invitedBy: string;
  }[];
  skippedInvites: {
    email: string;
    reason: "already_member" | "already_invited" | "duplicate";
  }[];
};

/**
 * Validates invites by checking for existing team members, pending invites, and duplicates
 */
async function validateInvites(
  db: Database,
  teamId: string,
  invites: {
    email: string;
    role: "owner" | "member";
    invitedBy: string;
  }[],
): Promise<InviteValidationResult> {
  // Remove duplicates from input
  const uniqueInvites = invites.filter(
    (invite, index, self) =>
      index ===
      self.findIndex(
        (i) => i.email.toLowerCase() === invite.email.toLowerCase(),
      ),
  );

  const emails = uniqueInvites.map((invite) => invite.email.toLowerCase());

  // Check for existing team members
  const existingMembers = await db
    .select({
      email: users.email,
    })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(
      and(
        eq(usersOnTeam.teamId, teamId),
        or(...emails.map((email) => sql`LOWER(${users.email}) = ${email}`)),
      ),
    );

  const existingMemberEmails = new Set(
    existingMembers
      .map((member) => member.email?.toLowerCase())
      .filter(Boolean),
  );

  // Check for pending invites
  const pendingInvites = await db
    .select({
      email: userInvites.email,
    })
    .from(userInvites)
    .where(
      and(
        eq(userInvites.teamId, teamId),
        or(
          ...emails.map((email) => sql`LOWER(${userInvites.email}) = ${email}`),
        ),
      ),
    );

  const pendingInviteEmails = new Set(
    pendingInvites.map((invite) => invite.email?.toLowerCase()).filter(Boolean),
  );

  const validInvites: typeof uniqueInvites = [];
  const skippedInvites: {
    email: string;
    reason: "already_member" | "already_invited" | "duplicate";
  }[] = [];

  // Process each invite
  for (const invite of uniqueInvites) {
    const emailLower = invite.email.toLowerCase();

    if (existingMemberEmails.has(emailLower)) {
      skippedInvites.push({
        email: invite.email,
        reason: "already_member",
      });
    } else if (pendingInviteEmails.has(emailLower)) {
      skippedInvites.push({
        email: invite.email,
        reason: "already_invited",
      });
    } else {
      validInvites.push(invite);
    }
  }

  return { validInvites, skippedInvites };
}

export async function createTeamInvites(
  db: Database,
  params: CreateTeamInvitesParams,
) {
  const { teamId, invites } = params;

  // Validate invites and filter out invalid ones
  const { validInvites, skippedInvites } = await validateInvites(
    db,
    teamId,
    invites,
  );

  // If no valid invites, return empty results with skipped info
  if (validInvites.length === 0) {
    return {
      results: [],
      skippedInvites,
    };
  }

  const results = await Promise.all(
    validInvites.map(async (invite) => {
      // Insert new invite with conflict handling to prevent race conditions
      const [row] = await db
        .insert(userInvites)
        .values({
          email: invite.email,
          role: invite.role,
          invitedBy: invite.invitedBy,
          teamId: teamId,
        })
        .onConflictDoNothing({
          target: [userInvites.teamId, userInvites.email],
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
      const team = await db.query.teams.findFirst({
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

  return {
    results: results.filter(Boolean),
    skippedInvites,
  };
}
