/**
 * Threshold in milliseconds for considering a pending document as "stale"
 * Documents pending for longer than this are likely stuck and need retry
 */
const STALE_PROCESSING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check if a document is stuck in processing (pending for >10 minutes)
 * Used to show retry options instead of infinite loading skeletons
 *
 * A document is only considered stale if:
 * - Status is "pending"
 * - It has never been successfully processed (no title)
 * - It was created more than 10 minutes ago
 *
 * Documents with a title that are pending are being reprocessed
 * and should show a skeleton, not be marked as stale.
 */
export function isStaleProcessing(
  processingStatus: string | null | undefined,
  createdAt: string | Date | null | undefined,
  title: string | null | undefined,
): boolean {
  // If document has a title, it was processed before and is being reprocessed
  // Don't consider it stale - show skeleton instead
  if (title) {
    return false;
  }

  if (processingStatus !== "pending" || !createdAt) {
    return false;
  }

  return (
    Date.now() - new Date(createdAt).getTime() > STALE_PROCESSING_THRESHOLD_MS
  );
}
