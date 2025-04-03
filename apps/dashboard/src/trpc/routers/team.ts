import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  acceptTeamInvite,
  createTeam,
  declineTeamInvite,
  leaveTeam,
  updateTeam,
} from "@midday/supabase/mutations";
import {
  getTeamByIdQuery,
  getTeamMembersQuery,
  getTeamsByUserIdQuery,
} from "@midday/supabase/queries";
import { TRPCError } from "@trpc/server";
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
        inbox_email: z.string().email().optional().nullable(),
        inbox_forwarding: z.boolean().optional().nullable(),
        logo_url: z.string().url().optional(),
        base_currency: z.string().optional(),
        document_classification: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await updateTeam(supabase, {
        id: teamId,
        name: input.name,
      });

      return data;
    }),

  members: protectedProcedure.query(async ({ ctx: { supabase, teamId } }) => {
    const { data } = await getTeamMembersQuery(supabase, teamId);

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
        currency: z.string(),
        logoUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { supabase, session }, input }) => {
      const { data } = await createTeam(supabase, {
        ...input,
        userId: session.user.id,
      });

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

      const currentUser = teamMembersData.find(
        (member) => member.user.id === session.user.id,
      );

      const totalOwners = teamMembersData.filter(
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
});
