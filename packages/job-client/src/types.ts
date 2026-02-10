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
  result?: unknown;
  error?: string;
}

/**
 * Job trigger response
 */
export interface JobTriggerResponse {
  id: string;
}
