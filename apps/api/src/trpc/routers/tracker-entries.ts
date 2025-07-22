import {
  deleteTrackerEntry,
  getCurrentTimer,
  getPausedEntries,
  getTimerStatus,
  getTrackerRecordsByDate,
  getTrackerRecordsByRange,
  pauseTimer,
  startTimer,
  stopTimer,
  upsertTrackerEntries,
} from "@api/db/queries/tracker-entries";
import {
  deleteTrackerEntrySchema,
  getCurrentTimerSchema,
  getTrackerRecordsByDateSchema,
  getTrackerRecordsByRangeSchema,
  pauseTimerSchema,
  startTimerSchema,
  stopTimerSchema,
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
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTrackerEntry(db, {
        teamId: teamId!,
        id: input.id,
      });
    }),

  // Timer endpoints (improved naming and functionality)
  start: protectedProcedure
    .input(startTimerSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const { assignedId, ...rest } = input;
      return startTimer(db, {
        ...rest,
        teamId: teamId!,
        assignedId: assignedId ?? session.user.id,
      });
    }),

  stop: protectedProcedure
    .input(stopTimerSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const { assignedId, ...rest } = input;
      return stopTimer(db, {
        ...rest,
        teamId: teamId!,
        assignedId: assignedId ?? session.user.id,
      });
    }),

  pause: protectedProcedure
    .input(pauseTimerSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const { assignedId, ...rest } = input;
      return pauseTimer(db, {
        ...rest,
        teamId: teamId!,
        assignedId: assignedId ?? session.user.id,
      });
    }),

  current: protectedProcedure
    .input(getCurrentTimerSchema.optional())
    .query(async ({ ctx: { db, teamId, session }, input }) => {
      const assignedId = input?.assignedId ?? session.user.id;
      return getCurrentTimer(db, {
        teamId: teamId!,
        assignedId,
      });
    }),

  status: protectedProcedure
    .input(getCurrentTimerSchema.optional())
    .query(async ({ ctx: { db, teamId, session }, input }) => {
      const assignedId = input?.assignedId ?? session.user.id;
      return getTimerStatus(db, {
        teamId: teamId!,
        assignedId,
      });
    }),

  paused: protectedProcedure
    .input(getCurrentTimerSchema.optional())
    .query(async ({ ctx: { db, teamId, session }, input }) => {
      const assignedId = input?.assignedId ?? session.user.id;
      return getPausedEntries(db, {
        teamId: teamId!,
        assignedId,
      });
    }),
});
