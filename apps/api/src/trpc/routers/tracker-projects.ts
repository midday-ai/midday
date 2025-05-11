import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteTrackerProject,
  upsertTrackerProject,
} from "@midday/supabase/mutations";
import {
  getTrackerProjectByIdQuery,
  getTrackerProjectsQuery,
} from "@midday/supabase/queries";
import { z } from "zod";

export const trackerProjectsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().nullable().optional(),
          pageSize: z.number().optional(),
          filter: z
            .object({
              q: z.string().nullable().optional(),
              start: z.string().nullable().optional(),
              end: z.string().nullable().optional(),
              status: z
                .enum(["in_progress", "completed"])
                .nullable()
                .optional(),
              customers: z.array(z.string()).nullable().optional(),
              tags: z.array(z.string()).nullable().optional(),
            })
            .optional(),
          sort: z.array(z.string()).nullable().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getTrackerProjectsQuery(supabase, {
        ...input,
        teamId: teamId!,
      });
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        estimate: z.number().nullable().optional(),
        billable: z.boolean().nullable().optional().default(false),
        rate: z.number().min(1).nullable().optional(),
        currency: z.string().nullable().optional(),
        status: z.enum(["in_progress", "completed"]).optional(),
        customer_id: z.string().uuid().nullable().optional(),
        tags: z
          .array(
            z.object({
              id: z.string().uuid(),
              value: z.string(),
            }),
          )
          .optional()
          .nullable(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await upsertTrackerProject(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteTrackerProject(supabase, {
        id: input.id,
      });

      return data;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getTrackerProjectByIdQuery(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),
});
