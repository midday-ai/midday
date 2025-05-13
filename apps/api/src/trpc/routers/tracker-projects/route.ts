import { getTrackerProjects } from "@api/db/queries/tracker-projects";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteTrackerProject,
  upsertTrackerProject,
} from "@midday/supabase/mutations";
import { getTrackerProjectByIdQuery } from "@midday/supabase/queries";
import {
  deleteTrackerProjectSchema,
  getTrackerProjectByIdSchema,
  getTrackerProjectsSchema,
  upsertTrackerProjectSchema,
} from "./schema";

export const trackerProjectsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getTrackerProjectsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTrackerProjects(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  upsert: protectedProcedure
    .input(upsertTrackerProjectSchema)
    .mutation(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await upsertTrackerProject(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),

  delete: protectedProcedure
    .input(deleteTrackerProjectSchema)
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteTrackerProject(supabase, {
        id: input.id,
      });

      return data;
    }),

  getById: protectedProcedure
    .input(getTrackerProjectByIdSchema)
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await getTrackerProjectByIdQuery(supabase, {
        ...input,
        teamId: teamId!,
      });

      return data;
    }),
});
