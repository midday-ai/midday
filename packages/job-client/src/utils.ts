/**
 * Encode queue name and job ID into a composite ID
 * @example encodeJobId("accounting", "21") => "accounting:21"
 */
export function encodeJobId(queueName: string, jobId: string): string {
  return `${queueName}:${jobId}`;
}

/**
 * Decode a composite job ID into queue name and job ID
 * @example decodeJobId("accounting:21") => { queueName: "accounting", jobId: "21" }
 * @throws Error if the format is invalid
 */
export function decodeJobId(compositeId: string): {
  queueName: string;
  jobId: string;
} {
  const idx = compositeId.indexOf(":");
  if (idx === -1) {
    throw new Error(`Invalid job ID format: ${compositeId}`);
  }
  return {
    queueName: compositeId.slice(0, idx),
    jobId: compositeId.slice(idx + 1),
  };
}
