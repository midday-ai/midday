import {
  deleteTrackerProject,
  getTrackerProjectById,
  getTrackerProjects,
  upsertTrackerProject,
} from "@api/db/queries/tracker-projects";
import {
  deleteTrackerProjectSchema,
  getTrackerProjectByIdSchema,
  getTrackerProjectsSchema,
  upsertTrackerProjectSchema,
} from "@api/schemas/tracker-projects";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

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
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return upsertTrackerProject(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTrackerProjectSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      return deleteTrackerProject(db, input.id);
    }),

  getById: protectedProcedure
    .input(getTrackerProjectByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getTrackerProjectById(db, {
        ...input,
        teamId: teamId!,
      });
    }),
});
