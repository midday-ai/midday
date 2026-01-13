import { documents } from "@midday/db/schema";
import type { Job } from "bullmq";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { CleanupStaleDocumentsPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Scheduled task that runs every 5 minutes to detect and mark stale documents
 * Documents stuck in "pending" status for more than 10 minutes are marked as "failed"
 * This is a safety net for edge cases like:
 * - Worker crashes mid-job
 * - Database errors during status update
 * - Any other unforeseen issues
 */
export class CleanupStaleDocumentsProcessor extends BaseProcessor<CleanupStaleDocumentsPayload> {
  async process(job: Job<CleanupStaleDocumentsPayload>): Promise<{
    staleDocumentsFound: number;
    documentsMarkedFailed: number;
  }> {
    const db = getDb();

    // Documents pending for more than 10 minutes are considered stale
    const staleThresholdMinutes = 10;
    const staleThreshold = new Date(
      Date.now() - staleThresholdMinutes * 60 * 1000,
    );

    this.logger.info("Starting stale document cleanup", {
      staleThresholdMinutes,
      staleThreshold: staleThreshold.toISOString(),
    });

    try {
      // Find documents that are still pending and were created more than 10 minutes ago
      // Use raw SQL for the date comparison to ensure proper timestamp handling
      const staleDocuments = await db
        .select({
          id: documents.id,
          name: documents.name,
          teamId: documents.teamId,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(
          and(
            eq(documents.processingStatus, "pending"),
            sql`${documents.createdAt} < ${staleThreshold.toISOString()}::timestamp`,
          ),
        )
        .limit(100); // Process in batches to avoid overwhelming the system

      if (staleDocuments.length === 0) {
        this.logger.info("No stale documents found");
        return { staleDocumentsFound: 0, documentsMarkedFailed: 0 };
      }

      this.logger.warn("Found stale documents, marking as failed", {
        count: staleDocuments.length,
        documents: staleDocuments.map((d) => ({
          id: d.id,
          name: d.name,
          teamId: d.teamId,
          createdAt: d.createdAt,
        })),
      });

      // Batch update all stale documents to failed status
      const staleIds = staleDocuments.map((d) => d.id);
      await db
        .update(documents)
        .set({
          processingStatus: "failed",
        })
        .where(
          and(
            eq(documents.processingStatus, "pending"),
            inArray(documents.id, staleIds),
          ),
        );

      this.logger.info("Stale document cleanup completed", {
        staleDocumentsFound: staleDocuments.length,
        documentsMarkedFailed: staleDocuments.length,
      });

      return {
        staleDocumentsFound: staleDocuments.length,
        documentsMarkedFailed: staleDocuments.length,
      };
    } catch (error) {
      this.logger.error("Failed to cleanup stale documents", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
