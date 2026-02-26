import { getDealById, updateDeal } from "@midday/db/queries";
import { decodeJobId } from "@midday/job-client";
import type { Job } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../config/job-options";
import { dealsQueue } from "../../queues/deals";
import type { ScheduleDealPayload } from "../../schemas/deals";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Schedule Deal Processor
 * Handles executing scheduled deals when their scheduled time arrives.
 * This processor is triggered by a delayed job when the scheduled time is reached.
 */
export class ScheduleDealProcessor extends BaseProcessor<ScheduleDealPayload> {
  async process(job: Job<ScheduleDealPayload>): Promise<void> {
    const { dealId } = job.data;
    const db = getDb();

    this.logger.info("Processing scheduled deal", {
      jobId: job.id,
      dealId,
    });

    // Get the deal to verify it's still scheduled (teamId optional)
    const deal = await getDealById(db, { id: dealId });

    if (!deal) {
      this.logger.error("Deal not found", { dealId });
      // Don't throw - deal may have been deleted
      return;
    }

    if (deal.status !== "scheduled") {
      this.logger.info("Deal is no longer scheduled, skipping", {
        dealId,
        status: deal.status,
      });
      // Don't throw - this is expected if deal was cancelled or already sent
      return;
    }

    // Skip if this is a recurring deal - those are handled by the recurring scheduler
    // This is a defensive check since recurring deals shouldn't have scheduled jobs
    if (deal.dealRecurringId && !deal.scheduledJobId) {
      this.logger.info(
        "Deal is part of recurring series without scheduledJobId, skipping",
        {
          dealId,
          dealRecurringId: deal.dealRecurringId,
        },
      );
      return;
    }

    // Verify this job is the currently scheduled one for this deal
    // This prevents stale jobs from processing if a reschedule failed to remove the old job
    // Note: scheduledJobId is stored as a composite ID (e.g., "deals:123")
    // but job.id is the raw BullMQ ID (e.g., "123"), so we need to decode
    if (deal.scheduledJobId) {
      try {
        const { jobId: expectedRawJobId } = decodeJobId(deal.scheduledJobId);
        if (expectedRawJobId !== job.id) {
          this.logger.info("Stale scheduled job detected, skipping", {
            dealId,
            currentJobId: job.id,
            expectedJobId: expectedRawJobId,
            storedCompositeId: deal.scheduledJobId,
          });
          // Don't throw - this is expected if deal was rescheduled
          return;
        }
      } catch {
        // If decoding fails, the stored ID is in an unexpected format
        // Log and skip to be safe
        this.logger.warn("Failed to decode scheduledJobId, skipping", {
          dealId,
          scheduledJobId: deal.scheduledJobId,
          currentJobId: job.id,
        });
        return;
      }
    }

    // Update deal status to unpaid before generating
    const updated = await updateDeal(db, {
      id: dealId,
      teamId: deal.teamId,
      status: "unpaid",
      // Clear the scheduled job id since it has now executed
      scheduledJobId: null,
    });

    if (!updated) {
      this.logger.error("Failed to update deal status", { dealId });
      throw new Error("Failed to update deal status");
    }

    // Queue the generate-deal job to create PDF and send email
    await dealsQueue.add(
      "generate-deal",
      {
        dealId,
        deliveryType: "create_and_send",
      },
      DEFAULT_JOB_OPTIONS,
    );

    this.logger.info("Scheduled deal queued for generation", {
      dealId,
    });
  }
}
