import {
  acceptTeamInviteSchema,
  createTeamSchema,
  declineTeamInviteSchema,
  deleteTeamInviteSchema,
  deleteTeamMemberSchema,
  deleteTeamSchema,
  inviteTeamMembersSchema,
  leaveTeamSchema,
  updateBaseCurrencySchema,
  updateTeamByIdSchema,
  updateTeamMemberSchema,
} from "@api/schemas/team";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import type { DeleteTeamPayload, InviteTeamMembersPayload } from "@jobs/schema";
import {
  acceptTeamInvite,
  createTeam,
  createTeamInvites,
  declineTeamInvite,
  deleteTeam,
  deleteTeamInvite,
  deleteTeamMember,
  getAvailablePlans,
  getBankConnections,
  getInvitesByEmail,
  getTeamById,
  getTeamInvites,
  getTeamMembersByTeamId,
  getTeamsByUserId,
  leaveTeam,
  updateTeamById,
  updateTeamMember,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { tasks } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) {
      return null;
    }

    return getTeamById(db, teamId!);
  }),

  update: protectedProcedure
    .input(updateTeamByIdSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateTeamById(db, {
        id: teamId!,
        data: input,
      });
    }),

  members: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTeamMembersByTeamId(db, teamId!);
  }),

  list: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getTeamsByUserId(db, session.user.id);
  }),

  create: protectedProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const requestId = `trpc_team_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[${requestId}] TRPC team creation request`, {
        userId: session.user.id,
        userEmail: session.user.email,
        teamName: input.name,
        baseCurrency: input.baseCurrency,
        countryCode: input.countryCode,
        switchTeam: input.switchTeam,
        timestamp: new Date().toISOString(),
      });

      try {
        const teamId = await createTeam(db, {
          ...input,
          userId: session.user.id,
          email: session.user.email!,
        });

        console.log(`[${requestId}] TRPC team creation successful`, {
          teamId,
          userId: session.user.id,
        });

        return teamId;
      } catch (error) {
        console.error(`[${requestId}] TRPC team creation failed`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: session.user.id,
          input,
        });
        throw error;
      }
    }),

  leave: protectedProcedure
    .input(leaveTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const teamMembersData = await getTeamMembersByTeamId(db, input.teamId);

      const currentUser = teamMembersData?.find(
        (member) => member.user?.id === session.user.id,
      );

      const totalOwners = teamMembersData?.filter(
        (member) => member.role === "owner",
      ).length;

      if (currentUser?.role === "owner" && totalOwners === 1) {
        throw Error("Action not allowed");
      }

      return leaveTeam(db, {
        userId: session.user.id,
        teamId: input.teamId,
      });
    }),

  acceptInvite: protectedProcedure
    .input(acceptTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return acceptTeamInvite(db, {
        id: input.id,
        userId: session.user.id,
      });
    }),

  declineInvite: protectedProcedure
    .input(declineTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return declineTeamInvite(db, {
        id: input.id,
        email: session.user.email!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const data = await deleteTeam(db, {
        teamId: input.teamId,
        userId: session.user.id,
      });

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Team not found",
        });
      }

      const bankConnections = await getBankConnections(db, {
        teamId: data.id,
      });

      if (bankConnections.length > 0) {
        await tasks.trigger("delete-team", {
          teamId: input.teamId!,
          connections: bankConnections.map((connection) => ({
            accessToken: connection.accessToken,
            provider: connection.provider,
            referenceId: connection.referenceId,
          })),
        } satisfies DeleteTeamPayload);
      }
    }),

  deleteMember: protectedProcedure
    .input(deleteTeamMemberSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteTeamMember(db, {
        teamId: input.teamId,
        userId: input.userId,
      });
    }),

  updateMember: protectedProcedure
    .input(updateTeamMemberSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return updateTeamMember(db, input);
    }),

  teamInvites: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTeamInvites(db, teamId!);
  }),

  invitesByEmail: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getInvitesByEmail(db, session.user.email!);
  }),

  invite: protectedProcedure
    .input(inviteTeamMembersSchema)
    .mutation(async ({ ctx: { db, session, teamId, geo }, input }) => {
      const ip = geo.ip ?? "127.0.0.1";

      const data = await createTeamInvites(db, {
        teamId: teamId!,
        invites: input.map((invite) => ({
          ...invite,
          invitedBy: session.user.id,
        })),
      });

      const results = data?.results ?? [];
      const skippedInvites = data?.skippedInvites ?? [];

      const invites = results.map((invite) => ({
        email: invite?.email!,
        invitedBy: session.user.id!,
        invitedByName: session.user.full_name!,
        invitedByEmail: session.user.email!,
        teamName: invite?.team?.name!,
        inviteCode: invite?.code!,
      }));

      // Only trigger email sending if there are valid invites
      if (invites.length > 0) {
        await tasks.trigger("invite-team-members", {
          teamId: teamId!,
          invites,
          ip,
          locale: "en",
        } satisfies InviteTeamMembersPayload);
      }

      // Return information about the invitation process
      return {
        sent: invites.length,
        skipped: skippedInvites.length,
        skippedInvites,
      };
    }),

  deleteInvite: protectedProcedure
    .input(deleteTeamInviteSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTeamInvite(db, {
        teamId: teamId!,
        id: input.id,
      });
    }),

  availablePlans: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getAvailablePlans(db, teamId!);
  }),

  updateBaseCurrency: protectedProcedure
    .input(updateBaseCurrencySchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      const event = await triggerJob(
        "update-base-currency",
        {
          teamId: teamId!,
          baseCurrency: input.baseCurrency,
        },
        "transactions",
      );

      return event;
    }),
});
