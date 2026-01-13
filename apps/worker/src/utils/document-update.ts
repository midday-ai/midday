import type { Database } from "@midday/db/client";
import {
  type UpdateDocumentByPathParams,
  updateDocumentByPath,
} from "@midday/db/queries";
import type { createLoggerWithContext } from "@midday/logger";

/**
 * Update a document by path with retry logic for race conditions.
 *
 * This handles the case where a Supabase storage trigger creates the document
 * record slightly after the job starts processing. If the first update returns
 * 0 rows (document not found), we retry after a short delay.
 *
 * @param db - Database connection
 * @param params - Update parameters (pathTokens, teamId, etc.)
 * @param logger - Logger instance for warning messages
 * @param maxRetries - Maximum number of attempts (default: 2)
 * @param delayMs - Delay between retries in milliseconds (default: 1000)
 * @returns Updated document records or empty array if all retries failed
 */
export async function updateDocumentWithRetry(
  db: Database,
  params: UpdateDocumentByPathParams,
  logger: ReturnType<typeof createLoggerWithContext>,
  maxRetries = 2,
  delayMs = 1000,
): Promise<Awaited<ReturnType<typeof updateDocumentByPath>>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await updateDocumentByPath(db, params);

    if (result && result.length > 0) {
      return result;
    }

    if (attempt < maxRetries) {
      logger.warn("Document update returned 0 rows, retrying", {
        attempt,
        maxRetries,
        pathTokens: params.pathTokens,
        teamId: params.teamId,
        delayMs,
      });
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Final attempt failed - return empty array
  logger.warn("Document update failed after all retries", {
    pathTokens: params.pathTokens,
    teamId: params.teamId,
    maxRetries,
  });

  return [];
}
