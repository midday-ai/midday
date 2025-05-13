import { z } from "zod";

export const getTrackerRecordsByDateSchema = z.object({ date: z.string() });

export const getTrackerRecordsByRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  projectId: z.string().optional(),
});

export const upsertTrackerEntriesSchema = z.object({
  id: z.string().optional(),
  start: z.string(),
  stop: z.string(),
  dates: z.array(z.string()),
  assignedId: z.string(),
  projectId: z.string(),
  description: z.string().optional().nullable(),
  duration: z.number(),
});

export const deleteTrackerEntrySchema = z.object({
  id: z.string(),
});
