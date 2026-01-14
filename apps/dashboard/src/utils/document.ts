/**
 * Threshold in milliseconds for considering a pending document as "stale"
 * Documents pending for longer than this are likely stuck and need retry
 */
const STALE_PROCESSING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check if a document is stuck in processing (pending for >10 minutes)
 * Used to show retry options instead of infinite loading skeletons
 *
 * A document is considered stale if:
 * - Status is "pending"
 * - It was created more than 10 minutes ago
 *
 * Documents with a title that are pending for a long time are likely
 * stuck (status never updated to completed), not being reprocessed.
 */
export function isStaleProcessing(
  processingStatus: string | null | undefined,
  createdAt: string | Date | null | undefined,
): boolean {
  if (processingStatus !== "pending" || !createdAt) {
    return false;
  }

  return (
    Date.now() - new Date(createdAt).getTime() > STALE_PROCESSING_THRESHOLD_MS
  );
}
