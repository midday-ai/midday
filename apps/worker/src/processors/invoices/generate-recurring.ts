import {
  checkInvoiceExists,
  draftInvoice,
  getCustomerById,
  getDueInvoiceRecurring,
  getNextInvoiceNumber,
  markInvoiceGenerated,
  recordInvoiceGenerationFailure,
  updateInvoice,
} from "@midday/db/queries";
import { getStartOfDayUTC } from "@midday/invoice/recurring";
import { generateToken } from "@midday/invoice/token";
import { transformCustomerToContent } from "@midday/invoice/utils";
import type { Job } from "bullmq";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_JOB_OPTIONS } from "../../config/job-options";
import {
  RecurringInvoiceError,
  RecurringInvoiceErrors,
} from "../../errors/invoice-errors";
import { invoicesQueue } from "../../queues/invoices";
import { notificationsQueue } from "../../queues/notifications";
import type { InvoiceRecurringSchedulerPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { isStaging } from "../../utils/env";
import {
  buildInvoiceTemplateFromRecurring,
  parseLineItems,
  stringifyJsonField,
  validateRecurringDataIntegrity,
} from "../../utils/invoice-template-builder";
import { BaseProcessor } from "../base";

type GeneratedInvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  recurringId: string;
  sequence: number;
};

type ProcessResult = {
  processed: number;
  skipped: number;
  failed: number;
  results: GeneratedInvoiceResult[];
  errors: Array<{ recurringId: string; error: string }>;
  hasMore: boolean;
};

/**
 * Scheduled processor that generates invoices from recurring invoice series
 * Runs every 2 hours to find and process due recurring invoices
 *
 * Duplicate processing is prevented by:
 * 1. BullMQ's upsertJobScheduler (ensures only one scheduler job exists)
 * 2. Idempotency check via checkInvoiceExists (prevents duplicate invoices)
 *
 * Kill switch: Set DISABLE_RECURRING_INVOICES=true to disable processing
 */
export class InvoiceRecurringSchedulerProcessor extends BaseProcessor<InvoiceRecurringSchedulerPayload> {
  async process(
    _job: Job<InvoiceRecurringSchedulerPayload>,
  ): Promise<ProcessResult> {
    // Kill switch - can be toggled without deploy via environment variable
    if (process.env.DISABLE_RECURRING_INVOICES === "true") {
      this.logger.warn(
        "Recurring invoice scheduler disabled via DISABLE_RECURRING_INVOICES",
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
        "[STAGING MODE] Recurring invoice scheduler - logging only, no execution",
      );

      const { data: dueRecurring, hasMore } = await getDueInvoiceRecurring(db);

      if (dueRecurring.length === 0) {
        this.logger.info("[STAGING] No recurring invoices due for generation");
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
        `[STAGING] Would process ${dueRecurring.length} recurring invoices${hasMore ? " (more pending)" : ""}`,
        {
          count: dueRecurring.length,
          hasMore,
          recurringInvoices: dueRecurring.map((r) => ({
            id: r.id,
            teamId: r.teamId,
            customerName: r.customerName,
            nextScheduledAt: r.nextScheduledAt,
            sequence: r.invoicesGenerated + 1,
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
          invoiceId: `[STAGING-SIMULATED-${r.id.slice(0, 8)}]`,
          invoiceNumber: `[STAGING-SIM-${r.invoicesGenerated + 1}]`,
          recurringId: r.id,
          sequence: r.invoicesGenerated + 1,
        })),
        errors: [],
        hasMore,
      };
    }

    this.logger.info("Starting recurring invoice scheduler");

    // Get due recurring invoices (batched for safety, default limit: 50)
    const { data: dueRecurring, hasMore } = await getDueInvoiceRecurring(db);

    if (dueRecurring.length === 0) {
      this.logger.info("No recurring invoices due for generation");
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
      `Found ${dueRecurring.length} recurring invoices to process${hasMore ? " (more pending)" : ""}`,
      { count: dueRecurring.length, hasMore },
    );

    const results: GeneratedInvoiceResult[] = [];
    const errors: Array<{ recurringId: string; error: string }> = [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const recurring of dueRecurring) {
      try {
        // Calculate the next sequence number
        const nextSequence = recurring.invoicesGenerated + 1;

        // Check if an invoice already exists for this sequence
        const existingInvoice = await checkInvoiceExists(db, {
          invoiceRecurringId: recurring.id,
          recurringSequence: nextSequence,
        });

        // Handle existing invoice cases
        if (existingInvoice) {
          // If the existing invoice is a draft or scheduled, send it now
          // This happens when user creates a future-dated recurring invoice
          // - "draft" = legacy behavior or edge case
          // - "scheduled" = future-dated recurring invoice waiting to be sent
          if (
            existingInvoice.status === "draft" ||
            existingInvoice.status === "scheduled"
          ) {
            this.logger.info(
              "Found existing invoice for sequence, sending it",
              {
                recurringId: recurring.id,
                sequence: nextSequence,
                invoiceId: existingInvoice.id,
                status: existingInvoice.status,
              },
            );

            // Mark the recurring series as having generated this invoice
            await markInvoiceGenerated(db, {
              id: recurring.id,
              teamId: recurring.teamId,
            });

            // Queue the existing invoice for generation and sending
            await invoicesQueue.add(
              "generate-invoice",
              {
                invoiceId: existingInvoice.id,
                deliveryType: "create_and_send",
              },
              DEFAULT_JOB_OPTIONS,
            );

            // Queue notification
            const invoiceNumber =
              existingInvoice.invoiceNumber ?? `REC-${nextSequence}`;
            await notificationsQueue.add(
              "notification",
              {
                type: "invoice_recurring_generated",
                invoiceId: existingInvoice.id,
                invoiceNumber,
                teamId: recurring.teamId,
                customerName: recurring.customerName ?? undefined,
                recurringId: recurring.id,
                recurringSequence: nextSequence,
                recurringTotalCount: recurring.endCount ?? undefined,
              },
              DEFAULT_JOB_OPTIONS,
            );

            results.push({
              invoiceId: existingInvoice.id,
              invoiceNumber,
              recurringId: recurring.id,
              sequence: nextSequence,
            });
            processed++;
            continue;
          }

          // Invoice exists and is already sent/paid - update series but don't re-send
          // This handles the case where user manually sent the invoice before scheduled date
          this.logger.info(
            "Invoice already exists and was already sent, updating series",
            {
              recurringId: recurring.id,
              sequence: nextSequence,
              status: existingInvoice.status,
            },
          );

          // Still mark the series as having generated this invoice
          // This ensures the series moves forward to the next scheduled date
          await markInvoiceGenerated(db, {
            id: recurring.id,
            teamId: recurring.teamId,
          });

          skipped++;
          continue;
        }

        // Defensive check: Validate recurring data integrity
        const validation = validateRecurringDataIntegrity(recurring);
        if (!validation.isValid) {
          throw RecurringInvoiceErrors.templateInvalid(
            recurring.id,
            validation.errors.join(", "),
            recurring.teamId,
          );
        }

        // Get fresh customer details if customer exists
        let customerDetails: string | null = null;
        let customerEmail: string | null = null;

        if (recurring.customerId) {
          const customer = await getCustomerById(db, {
            id: recurring.customerId,
            teamId: recurring.teamId,
          });

          // Defensive check: Customer was deleted after series creation
          if (!customer) {
            throw RecurringInvoiceErrors.customerNotFound(
              recurring.id,
              recurring.customerId,
              recurring.teamId,
            );
          }

          const customerContent = transformCustomerToContent(customer);
          customerDetails = customerContent
            ? JSON.stringify(customerContent)
            : null;
          customerEmail = customer.billingEmail || customer.email;

          // Defensive check: Customer exists but has no email
          if (!customerEmail) {
            throw RecurringInvoiceErrors.customerNoEmail(
              recurring.id,
              recurring.customerName || customer.name,
              recurring.teamId,
            );
          }
        } else {
          // No customer ID - customer was deleted (ON DELETE SET NULL in FK constraint)
          // The customerName field preserves the original name for better error messages
          throw RecurringInvoiceErrors.customerDeleted(
            recurring.id,
            recurring.customerName,
            recurring.teamId,
          );
        }

        // Generate new invoice ID and number
        const invoiceId = uuidv4();
        const invoiceNumber = await getNextInvoiceNumber(db, recurring.teamId);
        const token = await generateToken(invoiceId);

        // Calculate dates using the scheduled date, normalized to UTC midnight
        // This ensures consistency with manually created invoices
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
        const template = buildInvoiceTemplateFromRecurring(recurring);

        // Use transaction to ensure atomicity of invoice creation and recurring series update
        // This prevents partial state where invoice is created but recurring counter isn't updated
        const { updatedRecurring } = await db.transaction(async (tx) => {
          // Create draft invoice
          await draftInvoice(tx, {
            id: invoiceId,
            teamId: recurring.teamId,
            userId: recurring.userId,
            token,
            template,
            templateId: recurring.templateId ?? undefined,
            paymentDetails: stringifyJsonField(recurring.paymentDetails),
            fromDetails: stringifyJsonField(recurring.fromDetails),
            customerDetails,
            noteDetails: stringifyJsonField(recurring.noteDetails),
            dueDate,
            issueDate,
            invoiceNumber,
            vat: recurring.vat ?? undefined,
            tax: recurring.tax ?? undefined,
            discount: recurring.discount ?? undefined,
            subtotal: recurring.subtotal ?? undefined,
            topBlock: stringifyJsonField(recurring.topBlock),
            bottomBlock: stringifyJsonField(recurring.bottomBlock),
            amount: recurring.amount ?? undefined,
            lineItems: parseLineItems(recurring.lineItems),
            customerId: recurring.customerId ?? undefined,
            customerName: recurring.customerName ?? undefined,
          });

          // Update invoice with recurring reference
          // Note: Status remains "draft" until send-invoice-email.ts successfully sends the email
          // This prevents data inconsistency where status="unpaid" but sent_at=null if delivery fails
          await updateInvoice(tx, {
            id: invoiceId,
            teamId: recurring.teamId,
            sentTo: customerEmail,
            invoiceRecurringId: recurring.id,
            recurringSequence: nextSequence,
          });

          // Mark the recurring invoice as generated (updates next_scheduled_at and counter)
          const updatedRecurring = await markInvoiceGenerated(tx, {
            id: recurring.id,
            teamId: recurring.teamId,
          });

          return { updatedRecurring };
        });

        // Invoice was successfully created in the database at this point.
        // Record it as processed regardless of job queueing success.
        results.push({
          invoiceId,
          invoiceNumber,
          recurringId: recurring.id,
          sequence: nextSequence,
        });
        processed++;

        this.logger.info("Generated recurring invoice", {
          invoiceId,
          invoiceNumber,
          recurringId: recurring.id,
          sequence: nextSequence,
          customerName: recurring.customerName,
        });

        // Queue jobs AFTER transaction commits successfully.
        // Job queueing failures are handled separately - the invoice already exists
        // and will be picked up by idempotency checks on retry, or can be manually
        // processed via the dashboard.
        try {
          // Trigger invoice generation and sending via BullMQ
          await invoicesQueue.add(
            "generate-invoice",
            {
              invoiceId,
              deliveryType: "create_and_send",
            },
            DEFAULT_JOB_OPTIONS,
          );

          // Queue notification for invoice generation
          await notificationsQueue.add(
            "notification",
            {
              type: "invoice_recurring_generated",
              invoiceId,
              invoiceNumber,
              teamId: recurring.teamId,
              customerName: recurring.customerName ?? undefined,
              recurringId: recurring.id,
              recurringSequence: nextSequence,
              recurringTotalCount: recurring.endCount ?? undefined,
            },
            DEFAULT_JOB_OPTIONS,
          );

          // If series is now completed, queue completion notification
          if (updatedRecurring?.status === "completed") {
            await notificationsQueue.add(
              "notification",
              {
                type: "recurring_series_completed",
                invoiceId,
                invoiceNumber,
                teamId: recurring.teamId,
                customerName: recurring.customerName ?? undefined,
                recurringId: recurring.id,
                totalGenerated: nextSequence,
              },
              DEFAULT_JOB_OPTIONS,
            );

            this.logger.info("Recurring invoice series completed", {
              recurringId: recurring.id,
              teamId: recurring.teamId,
              totalGenerated: nextSequence,
            });
          }
        } catch (queueError) {
          // Job queueing failed, but the invoice was successfully created.
          // Do NOT call recordInvoiceGenerationFailure here - the invoice exists.
          // The invoice can be manually sent from the dashboard, or the generate-invoice
          // job can be retried when the queue recovers.
          const queueErrorMessage =
            queueError instanceof Error ? queueError.message : "Unknown error";
          this.logger.error(
            "Failed to queue jobs for recurring invoice - invoice was created but delivery pending",
            {
              invoiceId,
              invoiceNumber,
              recurringId: recurring.id,
              sequence: nextSequence,
              error: queueErrorMessage,
            },
          );
          // Note: The invoice exists with status "draft" and without a PDF.
          // It will appear in the dashboard where the user can manually generate and send it.
        }
      } catch (error) {
        // Handle typed RecurringInvoiceError with structured logging
        const isRecurringError = error instanceof RecurringInvoiceError;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorCode = isRecurringError ? error.code : "UNKNOWN";

        this.logger.error("Failed to generate recurring invoice", {
          recurringId: recurring.id,
          errorCode,
          error: errorMessage,
          requiresUserAction: isRecurringError
            ? error.requiresUserAction
            : undefined,
        });

        // Track the failure and check if we should auto-pause
        const { autoPaused } = await recordInvoiceGenerationFailure(db, {
          id: recurring.id,
          teamId: recurring.teamId,
        });

        if (autoPaused) {
          this.logger.warn(
            "Auto-paused recurring invoice due to repeated failures",
            {
              recurringId: recurring.id,
              teamId: recurring.teamId,
              errorCode,
            },
          );

          // Queue notification for auto-pause
          await notificationsQueue.add(
            "notification",
            {
              type: "recurring_series_paused",
              teamId: recurring.teamId,
              customerName: recurring.customerName ?? undefined,
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

    this.logger.info("Recurring invoice scheduler completed", {
      processed,
      skipped,
      failed,
      total: dueRecurring.length,
      hasMore,
    });

    if (hasMore) {
      this.logger.info(
        "More recurring invoices pending - will be processed in next scheduler run",
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
