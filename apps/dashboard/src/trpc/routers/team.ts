import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { deleteTeam as deleteTeamTask } from "@midday/jobs/tasks/team/delete";
import type { inviteTeamMembers } from "@midday/jobs/tasks/team/invite";
import type { updateBaseCurrency } from "@midday/jobs/tasks/transactions/update-base-currency";
import {
  acceptTeamInvite,
  createTeam,
  createTeamInvites,
  declineTeamInvite,
  deleteTeam,
  deleteTeamInvite,
  deleteTeamMember,
  leaveTeam,
  updateTeam,
  updateTeamMember,
} from "@midday/supabase/mutations";
import {
  getAvailablePlansQuery,
  getTeamByIdQuery,
  getTeamInvitesQuery,
  getTeamMembersQuery,
  getTeamsByUserIdQuery,
} from "@midday/supabase/queries";
import { tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { z } from "zod";

export const teamRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTeamByIdQuery(supabase, teamId!);

    return data;
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(32).optional(),
        email: z.string().email().optional(),
        logo_url: z.string().url().optional(),
        base_currency: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await updateTeam(supabase, {
        id: teamId!,
        name: input.name,
        email: input.email,
        logo_url: input.logo_url,
        base_currency: input.base_currency,
      });

      return data;
    }),

  members: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTeamMembersQuery(supabase, teamId!);

    return data;
  }),

  list: protectedProcedure.query(async ({ ctx: { supabase, session } }) => {
    const { data } = await getTeamsByUserIdQuery(supabase, session.user.id);

    return data;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        baseCurrency: z.string(),
      }),
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      const { data } = await createTeam(supabase, input);

      return {
        data,
      };
    }),

  leave: protectedProcedure
    .input(z.object({ teamId: z.string() }))
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
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx: { supabase, session }, input }) => {
      return acceptTeamInvite(supabase, {
        userId: session.user.id,
        teamId: input.teamId,
      });
    }),

  declineInvite: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx: { supabase, session }, input }) => {
      if (!session.user.email) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User email not found",
        });
      }

      return declineTeamInvite(supabase, {
        email: session.user.email,
        teamId: input.teamId,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ teamId: z.string() }))
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
    .input(z.object({ teamId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx: { supabase }, input }) => {
      return deleteTeamMember(supabase, {
        teamId: input.teamId,
        userId: input.userId,
      });
    }),

  updateMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
        role: z.enum(["owner", "member"]),
      }),
    )
    .mutation(async ({ ctx: { supabase }, input }) => {
      return updateTeamMember(supabase, input);
    }),

  invites: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTeamInvitesQuery(supabase, teamId!);

    return data;
  }),

  invite: protectedProcedure
    .input(
      z.array(
        z.object({
          email: z.string(),
          role: z.enum(["owner", "member"]),
        }),
      ),
    )
    .mutation(async ({ ctx: { supabase, session, teamId }, input }) => {
      const location = (await headers()).get("x-vercel-ip-city") ?? "Unknown";
      const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";

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
          invitedByName: session.user.user_metadata.full_name!,
          invitedByEmail: session.user.email!,
          teamName: invite.team?.name!,
          inviteCode: invite.code!,
        })) ?? [];

      await tasks.trigger<typeof inviteTeamMembers>("invite-team-members", {
        teamId: teamId!,
        invites,
        location,
        ip,
        locale: "en",
      });
    }),

  deleteInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
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
    .input(z.object({ baseCurrency: z.string() }))
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
