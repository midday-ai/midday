import { getBankConnections } from "@api/db/queries/bank-connections";
import {
  createTeam,
  deleteTeam,
  deleteTeamMember,
  getAvailablePlans,
  getTeamById,
  leaveTeam,
  updateTeamById,
  updateTeamMember,
} from "@api/db/queries/teams";
import {
  acceptTeamInvite,
  createTeamInvites,
  declineTeamInvite,
  deleteTeamInvite,
  getTeamInvites,
} from "@api/db/queries/user-invites";
import {
  getTeamMembers,
  getTeamsByUserId,
} from "@api/db/queries/users-on-team";
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
import type {
  DeleteTeamPayload,
  InviteTeamMembersPayload,
  UpdateBaseCurrencyPayload,
} from "@midday/jobs/schema";
import { tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
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
    return getTeamMembers(db, teamId!);
  }),

  list: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getTeamsByUserId(db, session.user.id);
  }),

  create: protectedProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return createTeam(db, { ...input, userId: session.user.id });
    }),

  leave: protectedProcedure
    .input(leaveTeamSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const teamMembersData = await getTeamMembers(db, input.teamId);

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
        userId: session.user.id,
        email: session.user.email!,
        teamId: input.teamId,
      });
    }),

  declineInvite: protectedProcedure
    .input(declineTeamInviteSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return declineTeamInvite(db, {
        email: session.user.email!,
        teamId: input.teamId,
      });
    }),

  delete: protectedProcedure
    .input(deleteTeamSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      const data = await deleteTeam(db, input.teamId);

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

  invites: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getTeamInvites(db, teamId!);
  }),

  invite: protectedProcedure
    .input(inviteTeamMembersSchema)
    .mutation(async ({ ctx: { db, session, teamId, geo }, input }) => {
      const ip = geo.ip ?? "127.0.0.1";

      const data = await createTeamInvites(db, {
        teamId: teamId!,
        invites: input.map((invite) => ({
          ...invite,
          invited_by: session.user.id,
        })),
      });

      const invites =
        data?.map((invite) => ({
          email: invite?.email!,
          invitedBy: session.user.id!,
          invitedByName: session.user.full_name!,
          invitedByEmail: session.user.email!,
          teamName: invite?.team?.name!,
          inviteCode: invite?.code!,
        })) ?? [];

      await tasks.trigger("invite-team-members", {
        teamId: teamId!,
        invites,
        ip,
        locale: "en",
      } satisfies InviteTeamMembersPayload);
    }),

  deleteInvite: protectedProcedure
    .input(deleteTeamInviteSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTeamInvite(db, {
        teamId: teamId!,
        inviteId: input.inviteId,
      });
    }),

  availablePlans: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getAvailablePlans(db, teamId!);
  }),

  updateBaseCurrency: protectedProcedure
    .input(updateBaseCurrencySchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      const event = await tasks.trigger("update-base-currency", {
        teamId: teamId!,
        baseCurrency: input.baseCurrency,
      } satisfies UpdateBaseCurrencyPayload);

      return event;
    }),
});
