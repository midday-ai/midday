import { z } from "zod";

/**
 * Schema for getting job status by ID
 */
export const getJobStatusSchema = z.object({
  jobId: z.string(),
});

/**
 * Schema for job status response
 */
export const jobStatusSchema = z.object({
  status: z.enum([
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "unknown",
  ]),
  progress: z.number().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

export type GetJobStatusInput = z.infer<typeof getJobStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
