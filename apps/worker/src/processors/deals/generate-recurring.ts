import {
  checkDealExists,
  draftDeal,
  getMerchantById,
  getDueDealRecurring,
  getNextDealNumber,
  markDealGenerated,
  recordDealGenerationFailure,
  updateDeal,
} from "@midday/db/queries";
import { getStartOfDayUTC } from "@midday/deal/recurring";
import { generateToken } from "@midday/deal/token";
import { transformMerchantToContent } from "@midday/deal/utils";
import type { Job } from "bullmq";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_JOB_OPTIONS } from "../../config/job-options";
import {
  RecurringDealError,
  RecurringDealErrors,
} from "../../errors/deal-errors";
import { dealsQueue } from "../../queues/deals";
import type { DealRecurringSchedulerPayload } from "../../schemas/deals";
import { getDb } from "../../utils/db";
import { isStaging } from "../../utils/env";
import {
  buildDealTemplateFromRecurring,
  parseLineItems,
  stringifyJsonField,
  validateRecurringDataIntegrity,
} from "../../utils/deal-template-builder";
import { BaseProcessor } from "../base";

type GeneratedDealResult = {
  dealId: string;
  dealNumber: string;
  recurringId: string;
  sequence: number;
};

type ProcessResult = {
  processed: number;
  skipped: number;
  failed: number;
  results: GeneratedDealResult[];
  errors: Array<{ recurringId: string; error: string }>;
  hasMore: boolean;
};

/**
 * Scheduled processor that generates deals from recurring deal series
 * Runs every 2 hours to find and process due recurring deals
 *
 * Duplicate processing is prevented by:
 * 1. BullMQ's upsertJobScheduler (ensures only one scheduler job exists)
 * 2. Idempotency check via checkDealExists (prevents duplicate deals)
 *
 * Kill switch: Set DISABLE_RECURRING_DEALS=true to disable processing
 */
export class DealRecurringSchedulerProcessor extends BaseProcessor<DealRecurringSchedulerPayload> {
  async process(
    job: Job<DealRecurringSchedulerPayload>,
  ): Promise<ProcessResult> {
    // Kill switch - can be toggled without deploy via environment variable
    if (process.env.DISABLE_RECURRING_DEALS === "true") {
      this.logger.warn(
        "Recurring deal scheduler disabled via DISABLE_RECURRING_DEALS",
      );
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        results: [],
        errors: [],
        hasMore: false,
      };
    }

    const db = getDb();

    // In staging, log what would happen but don't execute
    if (isStaging()) {
      this.logger.info(
        "[STAGING MODE] Recurring deal scheduler - logging only, no execution",
      );

      const { data: dueRecurring, hasMore } = await getDueDealRecurring(db);

      if (dueRecurring.length === 0) {
        this.logger.info("[STAGING] No recurring deals due for generation");
        return {
          processed: 0,
          skipped: 0,
          failed: 0,
          results: [],
          errors: [],
          hasMore: false,
        };
      }

      this.logger.info(
        `[STAGING] Would process ${dueRecurring.length} recurring deals${hasMore ? " (more pending)" : ""}`,
        {
          count: dueRecurring.length,
          hasMore,
          recurringDeals: dueRecurring.map((r) => ({
            id: r.id,
            teamId: r.teamId,
            merchantName: r.merchantName,
            nextScheduledAt: r.nextScheduledAt,
            sequence: r.dealsGenerated + 1,
            amount: r.amount,
            currency: r.currency,
          })),
        },
      );

      // Return simulated results
      return {
        processed: dueRecurring.length,
        skipped: 0,
        failed: 0,
        results: dueRecurring.map((r) => ({
          dealId: `[STAGING-SIMULATED-${r.id.slice(0, 8)}]`,
          dealNumber: `[STAGING-SIM-${r.dealsGenerated + 1}]`,
          recurringId: r.id,
          sequence: r.dealsGenerated + 1,
        })),
        errors: [],
        hasMore,
      };
    }

    this.logger.info("Starting recurring deal scheduler");

    // Get due recurring deals (batched for safety, default limit: 50)
    const { data: dueRecurring, hasMore } = await getDueDealRecurring(db);

    if (dueRecurring.length === 0) {
      this.logger.info("No recurring deals due for generation");
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        results: [],
        errors: [],
        hasMore: false,
      };
    }

    this.logger.info(
      `Found ${dueRecurring.length} recurring deals to process${hasMore ? " (more pending)" : ""}`,
      { count: dueRecurring.length, hasMore },
    );

    const results: GeneratedDealResult[] = [];
    const errors: Array<{ recurringId: string; error: string }> = [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const recurring of dueRecurring) {
      try {
        // Calculate the next sequence number
        const nextSequence = recurring.dealsGenerated + 1;

        // Check if a deal already exists for this sequence
        const existingDeal = await checkDealExists(db, {
          dealRecurringId: recurring.id,
          recurringSequence: nextSequence,
        });

        // Handle existing deal cases
        if (existingDeal) {
          // If the existing deal is a draft or scheduled, send it now
          // This happens when user creates a future-dated recurring deal
          // - "draft" = legacy behavior or edge case
          // - "scheduled" = future-dated recurring deal waiting to be sent
          if (
            existingDeal.status === "draft" ||
            existingDeal.status === "scheduled"
          ) {
            this.logger.info(
              "Found existing deal for sequence, sending it",
              {
                recurringId: recurring.id,
                sequence: nextSequence,
                dealId: existingDeal.id,
                status: existingDeal.status,
              },
            );

            // Mark the recurring series as having generated this deal
            await markDealGenerated(db, {
              id: recurring.id,
              teamId: recurring.teamId,
            });

            // Queue the existing deal for generation and sending
            await dealsQueue.add(
              "generate-deal",
              {
                dealId: existingDeal.id,
                deliveryType: "create_and_send",
              },
              DEFAULT_JOB_OPTIONS,
            );

            // Queue notification
            const dealNumber =
              existingDeal.dealNumber ?? `REC-${nextSequence}`;
            await dealsQueue.add(
              "deal-notification",
              {
                type: "recurring_generated",
                dealId: existingDeal.id,
                dealNumber,
                teamId: recurring.teamId,
                merchantName: recurring.merchantName ?? undefined,
                recurringId: recurring.id,
                recurringSequence: nextSequence,
                recurringTotalCount: recurring.endCount ?? undefined,
              },
              DEFAULT_JOB_OPTIONS,
            );

            results.push({
              dealId: existingDeal.id,
              dealNumber,
              recurringId: recurring.id,
              sequence: nextSequence,
            });
            processed++;
            continue;
          }

          // Deal exists and is already sent/paid - update series but don't re-send
          // This handles the case where user manually sent the deal before scheduled date
          this.logger.info(
            "Deal already exists and was already sent, updating series",
            {
              recurringId: recurring.id,
              sequence: nextSequence,
              status: existingDeal.status,
            },
          );

          // Still mark the series as having generated this deal
          // This ensures the series moves forward to the next scheduled date
          await markDealGenerated(db, {
            id: recurring.id,
            teamId: recurring.teamId,
          });

          skipped++;
          continue;
        }

        // Defensive check: Validate recurring data integrity
        const validation = validateRecurringDataIntegrity(recurring);
        if (!validation.isValid) {
          throw RecurringDealErrors.templateInvalid(
            recurring.id,
            validation.errors.join(", "),
            recurring.teamId,
          );
        }

        // Get fresh merchant details if merchant exists
        let merchantDetails: string | null = null;
        let merchantEmail: string | null = null;

        if (recurring.merchantId) {
          const merchant = await getMerchantById(db, {
            id: recurring.merchantId,
            teamId: recurring.teamId,
          });

          // Defensive check: merchant was deleted after series creation
          if (!merchant) {
            throw RecurringDealErrors.merchantNotFound(
              recurring.id,
              recurring.merchantId,
              recurring.teamId,
            );
          }

          const merchantContent = transformMerchantToContent(merchant);
          merchantDetails = merchantContent
            ? JSON.stringify(merchantContent)
            : null;
          merchantEmail = merchant.billingEmail || merchant.email;

          // Defensive check: merchant exists but has no email
          if (!merchantEmail) {
            throw RecurringDealErrors.merchantNoEmail(
              recurring.id,
              recurring.merchantName || merchant.name,
              recurring.teamId,
            );
          }
        } else {
          // No merchant ID - merchant was deleted (ON DELETE SET NULL in FK constraint)
          // The merchantName DB field preserves the original name for better error messages
          throw RecurringDealErrors.merchantDeleted(
            recurring.id,
            recurring.merchantName,
            recurring.teamId,
          );
        }

        // Generate new deal ID and number
        const dealId = uuidv4();
        const dealNumber = await getNextDealNumber(db, recurring.teamId);
        const token = await generateToken(dealId);

        // Calculate dates using the scheduled date, normalized to UTC midnight
        // This ensures consistency with manually created deals
        // Use getStartOfDayUTC (not localDateToUTCMidnight) because this runs on the server
        // and we want to preserve the UTC date, not the server's local date
        const scheduledDate = recurring.nextScheduledAt
          ? new Date(recurring.nextScheduledAt)
          : new Date();
        const issueDateUTC = getStartOfDayUTC(scheduledDate);
        const issueDate = issueDateUTC.toISOString();
        const dueDate = addDays(
          issueDateUTC,
          recurring.dueDateOffset,
        ).toISOString();

        // Build template from recurring data using shared utility
        const template = buildDealTemplateFromRecurring(recurring);

        // Use transaction to ensure atomicity of deal creation and recurring series update
        // This prevents partial state where deal is created but recurring counter isn't updated
        const { updatedRecurring } = await db.transaction(async (tx) => {
          // Create draft deal
          await draftDeal(tx, {
            id: dealId,
            teamId: recurring.teamId,
            userId: recurring.userId,
            token,
            template,
            templateId: recurring.templateId ?? undefined,
            paymentDetails: stringifyJsonField(recurring.paymentDetails),
            fromDetails: stringifyJsonField(recurring.fromDetails),
            merchantDetails: merchantDetails,
            noteDetails: stringifyJsonField(recurring.noteDetails),
            dueDate,
            issueDate,
            dealNumber,
            vat: recurring.vat ?? undefined,
            tax: recurring.tax ?? undefined,
            discount: recurring.discount ?? undefined,
            subtotal: recurring.subtotal ?? undefined,
            topBlock: stringifyJsonField(recurring.topBlock),
            bottomBlock: stringifyJsonField(recurring.bottomBlock),
            amount: recurring.amount ?? undefined,
            lineItems: parseLineItems(recurring.lineItems),
            merchantId: recurring.merchantId ?? undefined,
            merchantName: recurring.merchantName ?? undefined,
          });

          // Update deal with recurring reference
          // Note: Status remains "draft" until send-deal-email.ts successfully sends the email
          // This prevents data inconsistency where status="unpaid" but sent_at=null if delivery fails
          await updateDeal(tx, {
            id: dealId,
            teamId: recurring.teamId,
            sentTo: merchantEmail,
            dealRecurringId: recurring.id,
            recurringSequence: nextSequence,
          });

          // Mark the recurring deal as generated (updates next_scheduled_at and counter)
          const updatedRecurring = await markDealGenerated(tx, {
            id: recurring.id,
            teamId: recurring.teamId,
          });

          return { updatedRecurring };
        });

        // Deal was successfully created in the database at this point.
        // Record it as processed regardless of job queueing success.
        results.push({
          dealId,
          dealNumber,
          recurringId: recurring.id,
          sequence: nextSequence,
        });
        processed++;

        this.logger.info("Generated recurring deal", {
          dealId,
          dealNumber,
          recurringId: recurring.id,
          sequence: nextSequence,
          merchantName: recurring.merchantName,
        });

        // Queue jobs AFTER transaction commits successfully.
        // Job queueing failures are handled separately - the deal already exists
        // and will be picked up by idempotency checks on retry, or can be manually
        // processed via the dashboard.
        try {
          // Trigger deal generation and sending via BullMQ
          await dealsQueue.add(
            "generate-deal",
            {
              dealId,
              deliveryType: "create_and_send",
            },
            DEFAULT_JOB_OPTIONS,
          );

          // Queue notification for deal generation
          await dealsQueue.add(
            "deal-notification",
            {
              type: "recurring_generated",
              dealId,
              dealNumber,
              teamId: recurring.teamId,
              merchantName: recurring.merchantName ?? undefined,
              recurringId: recurring.id,
              recurringSequence: nextSequence,
              recurringTotalCount: recurring.endCount ?? undefined,
            },
            DEFAULT_JOB_OPTIONS,
          );

          // If series is now completed, queue completion notification
          if (updatedRecurring?.status === "completed") {
            await dealsQueue.add(
              "deal-notification",
              {
                type: "recurring_series_completed",
                dealId,
                dealNumber,
                teamId: recurring.teamId,
                merchantName: recurring.merchantName ?? undefined,
                recurringId: recurring.id,
                recurringSequence: nextSequence,
                recurringTotalCount: recurring.endCount ?? undefined,
              },
              DEFAULT_JOB_OPTIONS,
            );

            this.logger.info("Recurring deal series completed", {
              recurringId: recurring.id,
              teamId: recurring.teamId,
              totalGenerated: nextSequence,
            });
          }
        } catch (queueError) {
          // Job queueing failed, but the deal was successfully created.
          // Do NOT call recordDealGenerationFailure here - the deal exists.
          // The deal can be manually sent from the dashboard, or the generate-deal
          // job can be retried when the queue recovers.
          const queueErrorMessage =
            queueError instanceof Error ? queueError.message : "Unknown error";
          this.logger.error(
            "Failed to queue jobs for recurring deal - deal was created but delivery pending",
            {
              dealId,
              dealNumber,
              recurringId: recurring.id,
              sequence: nextSequence,
              error: queueErrorMessage,
            },
          );
          // Note: The deal exists with status "draft" and without a PDF.
          // It will appear in the dashboard where the user can manually generate and send it.
        }
      } catch (error) {
        // Handle typed RecurringDealError with structured logging
        const isRecurringError = error instanceof RecurringDealError;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorCode = isRecurringError ? error.code : "UNKNOWN";

        this.logger.error("Failed to generate recurring deal", {
          recurringId: recurring.id,
          errorCode,
          error: errorMessage,
          requiresUserAction: isRecurringError
            ? error.requiresUserAction
            : undefined,
        });

        // Track the failure and check if we should auto-pause
        const { autoPaused } = await recordDealGenerationFailure(db, {
          id: recurring.id,
          teamId: recurring.teamId,
        });

        if (autoPaused) {
          this.logger.warn(
            "Auto-paused recurring deal due to repeated failures",
            {
              recurringId: recurring.id,
              teamId: recurring.teamId,
              errorCode,
            },
          );

          // Queue notification for auto-pause
          await dealsQueue.add(
            "deal-notification",
            {
              type: "recurring_series_paused",
              dealId: recurring.id, // Use recurring ID as placeholder
              dealNumber: `Recurring-${recurring.id.slice(0, 8)}`,
              teamId: recurring.teamId,
              merchantName: recurring.merchantName ?? undefined,
              recurringId: recurring.id,
            },
            DEFAULT_JOB_OPTIONS,
          );
        }

        errors.push({
          recurringId: recurring.id,
          error: isRecurringError ? error.getUserMessage() : errorMessage,
        });
        failed++;
      }
    }

    this.logger.info("Recurring deal scheduler completed", {
      processed,
      skipped,
      failed,
      total: dueRecurring.length,
      hasMore,
    });

    if (hasMore) {
      this.logger.info(
        "More recurring deals pending - will be processed in next scheduler run",
      );
    }

    return {
      processed,
      skipped,
      failed,
      results,
      errors,
      hasMore,
    };
  }
}
