import { getTrackerProjectsQuery } from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

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
});
