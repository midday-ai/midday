/**
 * Job status enum matching the API schema
 */
export type JobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "unknown";

/**
 * Job status response matching the API schema
 */
export interface JobStatusResponse {
  status: JobStatus;
  progress?: number;
  progressStep?: string;
  /** Raw structured progress data from the job (when progress is an object) */
  progressData?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
}

/**
 * Job trigger response
 */
export interface JobTriggerResponse {
  id: string;
}
