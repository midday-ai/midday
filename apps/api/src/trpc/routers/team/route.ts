import { createTeam, getTeamById, updateTeamById } from "@api/db/queries/teams";
import {
  acceptTeamInvite,
  declineTeamInvite,
} from "@api/db/queries/user-invites";
import {
  getTeamMembers,
  getTeamsByUserId,
} from "@api/db/queries/users-on-team";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import type { deleteTeam as deleteTeamTask } from "@midday/jobs/tasks/team/delete";
import type { inviteTeamMembers } from "@midday/jobs/tasks/team/invite";
import type { updateBaseCurrency } from "@midday/jobs/tasks/transactions/update-base-currency";
import { tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
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
} from "./schema";

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
    .mutation(async ({ ctx: { supabase, session }, input }) => {
      const { data: teamMembersData } = await getTeamMembersQuery(
        supabase,
        input.teamId,
      );

      const currentUser = teamMembersData?.find(
        (member) => member.user.id === session.user.id,
      );

      const totalOwners = teamMembersData?.filter(
        (member) => member.role === "owner",
      ).length;

      if (currentUser?.role === "owner" && totalOwners === 1) {
        throw Error("Action not allowed");
      }

      return leaveTeam(supabase, {
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
    .mutation(async ({ ctx: { supabase }, input }) => {
      const data = await deleteTeam(supabase, {
        teamId: input.teamId,
      });

      if (!data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Team not found",
        });
      }

      if (data.bank_connections.length > 0) {
        await tasks.trigger<typeof deleteTeamTask>("delete-team", {
          teamId: input.teamId!,
          connections: data.bank_connections,
        });
      }
    }),

  deleteMember: protectedProcedure
    .input(deleteTeamMemberSchema)
    .mutation(async ({ ctx: { supabase }, input }) => {
      return deleteTeamMember(supabase, {
        teamId: input.teamId,
        userId: input.userId,
      });
    }),

  updateMember: protectedProcedure
    .input(updateTeamMemberSchema)
    .mutation(async ({ ctx: { supabase }, input }) => {
      return updateTeamMember(supabase, input);
    }),

  invites: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTeamInvitesQuery(supabase, teamId!);

    return data;
  }),

  invite: protectedProcedure
    .input(inviteTeamMembersSchema)
    .mutation(async ({ ctx: { supabase, session, teamId, geo }, input }) => {
      const ip = geo.ip ?? "127.0.0.1";

      const { data } = await createTeamInvites(supabase, {
        teamId: teamId!,
        invites: input.map((invite) => ({
          ...invite,
          invited_by: session.user.id,
        })),
      });

      const invites =
        data?.map((invite) => ({
          email: invite.email!,
          invitedBy: session.user.id!,
          invitedByName: session.user.full_name!,
          invitedByEmail: session.user.email!,
          teamName: invite.team?.name!,
          inviteCode: invite.code!,
        })) ?? [];

      await tasks.trigger<typeof inviteTeamMembers>("invite-team-members", {
        teamId: teamId!,
        invites,
        ip,
        locale: "en",
      });
    }),

  deleteInvite: protectedProcedure
    .input(deleteTeamInviteSchema)
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      return deleteTeamInvite(supabase, {
        teamId: teamId!,
        inviteId: input.inviteId,
      });
    }),

  availablePlans: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await getAvailablePlansQuery(supabase, teamId!);

      return data;
    },
  ),

  updateBaseCurrency: protectedProcedure
    .input(updateBaseCurrencySchema)
    .mutation(async ({ ctx: { teamId }, input }) => {
      const event = await tasks.trigger<typeof updateBaseCurrency>(
        "update-base-currency",
        {
          teamId: teamId!,
          baseCurrency: input.baseCurrency,
        },
      );

      return event;
    }),
});
