import {
  deleteTrackerEntry,
  getTrackerRecordsByDate,
  getTrackerRecordsByRange,
  upsertTrackerEntries,
} from "@api/db/queries/tracker-entries";
import {
  deleteTrackerEntrySchema,
  getTrackerRecordsByDateSchema,
  getTrackerRecordsByRangeSchema,
  upsertTrackerEntriesSchema,
} from "@api/schemas/tracker-entries";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";

export const trackerEntriesRouter = createTRPCRouter({
  byDate: protectedProcedure
    .input(getTrackerRecordsByDateSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getTrackerRecordsByDate(db, {
        date: input.date,
        teamId: teamId!,
      });
    }),

  byRange: protectedProcedure
    .input(getTrackerRecordsByRangeSchema)
    .query(async ({ input, ctx: { db, session, teamId } }) => {
      return getTrackerRecordsByRange(db, {
        teamId: teamId!,
        userId: session.user.id,
        ...input,
      });
    }),

  upsert: protectedProcedure
    .input(upsertTrackerEntriesSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return upsertTrackerEntries(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTrackerEntrySchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return deleteTrackerEntry(db, input.id);
    }),
});
