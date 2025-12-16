import { z } from "zod";

/**
 * Schema for getting job status by composite ID
 * The jobId contains both queue name and job ID (e.g., "accounting:21")
 */
export const getJobStatusSchema = z.object({
  jobId: z.string(), // Composite ID: "queueName:jobId"
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
