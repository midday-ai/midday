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
import { generateToken } from "@midday/invoice/token";
import { transformCustomerToContent } from "@midday/invoice/utils";
import type { Job } from "bullmq";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { invoicesQueue } from "../../queues/invoices";
import type { InvoiceRecurringSchedulerPayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
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
};

/**
 * Scheduled processor that generates invoices from recurring invoice series
 * Runs every 6 hours to find and process due recurring invoices
 */
export class InvoiceRecurringSchedulerProcessor extends BaseProcessor<InvoiceRecurringSchedulerPayload> {
  async process(
    job: Job<InvoiceRecurringSchedulerPayload>,
  ): Promise<ProcessResult> {
    const db = getDb();

    this.logger.info("Starting recurring invoice scheduler");

    // Get all due recurring invoices
    const dueRecurring = await getDueInvoiceRecurring(db);

    if (dueRecurring.length === 0) {
      this.logger.info("No recurring invoices due for generation");
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        results: [],
        errors: [],
      };
    }

    this.logger.info(
      `Found ${dueRecurring.length} recurring invoices to process`,
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

        // Idempotency check: Skip if invoice already exists for this sequence
        const alreadyExists = await checkInvoiceExists(db, {
          invoiceRecurringId: recurring.id,
          recurringSequence: nextSequence,
        });

        if (alreadyExists) {
          this.logger.info("Invoice already exists for sequence, skipping", {
            recurringId: recurring.id,
            sequence: nextSequence,
          });
          skipped++;
          continue;
        }

        // Get fresh customer details if customer exists
        let customerDetails: string | null = null;
        let customerEmail: string | null = null;

        if (recurring.customerId) {
          const customer = await getCustomerById(db, {
            id: recurring.customerId,
            teamId: recurring.teamId,
          });

          if (customer) {
            const customerContent = transformCustomerToContent(customer);
            customerDetails = customerContent
              ? JSON.stringify(customerContent)
              : null;
            customerEmail = customer.billingEmail || customer.email;
          }
        }

        // Generate new invoice ID and number
        const invoiceId = uuidv4();
        const invoiceNumber = await getNextInvoiceNumber(db, recurring.teamId);
        const token = await generateToken(invoiceId);

        // Calculate dates
        const now = new Date();
        const issueDate = now.toISOString();
        const dueDate = addDays(now, recurring.dueDateOffset).toISOString();

        // Build template from recurring data
        const template = (recurring.template as Record<string, unknown>) || {};

        // Use transaction to ensure atomicity of invoice creation and recurring series update
        // This prevents partial state where invoice is created but recurring counter isn't updated
        const { updatedRecurring } = await db.transaction(async (tx) => {
          // Create draft invoice
          await draftInvoice(tx, {
            id: invoiceId,
            teamId: recurring.teamId,
            userId: recurring.userId,
            token,
            template: {
              customerLabel: (template.customerLabel as string) ?? "To",
              title: (template.title as string) ?? "Invoice",
              fromLabel: (template.fromLabel as string) ?? "From",
              invoiceNoLabel:
                (template.invoiceNoLabel as string) ?? "Invoice No",
              issueDateLabel:
                (template.issueDateLabel as string) ?? "Issue Date",
              dueDateLabel: (template.dueDateLabel as string) ?? "Due Date",
              descriptionLabel:
                (template.descriptionLabel as string) ?? "Description",
              priceLabel: (template.priceLabel as string) ?? "Price",
              quantityLabel: (template.quantityLabel as string) ?? "Quantity",
              totalLabel: (template.totalLabel as string) ?? "Total",
              totalSummaryLabel:
                (template.totalSummaryLabel as string) ?? "Total",
              vatLabel: (template.vatLabel as string) ?? "VAT",
              subtotalLabel: (template.subtotalLabel as string) ?? "Subtotal",
              taxLabel: (template.taxLabel as string) ?? "Tax",
              discountLabel: (template.discountLabel as string) ?? "Discount",
              timezone: recurring.timezone,
              paymentLabel:
                (template.paymentLabel as string) ?? "Payment Details",
              noteLabel: (template.noteLabel as string) ?? "Note",
              logoUrl: (template.logoUrl as string | null) ?? null,
              currency: recurring.currency ?? "USD",
              dateFormat: (template.dateFormat as string) ?? "dd/MM/yyyy",
              includeVat: (template.includeVat as boolean) ?? false,
              includeTax: (template.includeTax as boolean) ?? false,
              includeDiscount: (template.includeDiscount as boolean) ?? false,
              includeDecimals: (template.includeDecimals as boolean) ?? false,
              includeUnits: (template.includeUnits as boolean) ?? false,
              includeQr: (template.includeQr as boolean) ?? true,
              taxRate: (template.taxRate as number) ?? 0,
              vatRate: (template.vatRate as number) ?? 0,
              size: (template.size as "a4" | "letter") ?? "a4",
              deliveryType: "create_and_send" as const,
              locale: (template.locale as string) ?? "en-US",
            },
            templateId: recurring.templateId ?? undefined,
            paymentDetails: recurring.paymentDetails
              ? JSON.stringify(recurring.paymentDetails)
              : null,
            fromDetails: recurring.fromDetails
              ? JSON.stringify(recurring.fromDetails)
              : null,
            customerDetails,
            noteDetails: recurring.noteDetails
              ? JSON.stringify(recurring.noteDetails)
              : null,
            dueDate,
            issueDate,
            invoiceNumber,
            vat: recurring.vat ?? undefined,
            tax: recurring.tax ?? undefined,
            discount: recurring.discount ?? undefined,
            subtotal: recurring.subtotal ?? undefined,
            topBlock: recurring.topBlock
              ? JSON.stringify(recurring.topBlock)
              : null,
            bottomBlock: recurring.bottomBlock
              ? JSON.stringify(recurring.bottomBlock)
              : null,
            amount: recurring.amount ?? undefined,
            lineItems: recurring.lineItems as
              | Array<{
                  name?: string | null;
                  quantity?: number;
                  unit?: string | null;
                  price?: number;
                  vat?: number | null;
                  tax?: number | null;
                  taxRate?: number | null;
                  productId?: string;
                }>
              | undefined,
            customerId: recurring.customerId ?? undefined,
            customerName: recurring.customerName ?? undefined,
          });

          // Update invoice with recurring reference, status, and sentTo
          await updateInvoice(tx, {
            id: invoiceId,
            teamId: recurring.teamId,
            status: "unpaid",
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
            {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            },
          );

          // Queue notification for invoice generation
          await invoicesQueue.add(
            "invoice-notification",
            {
              type: "recurring_generated",
              invoiceId,
              invoiceNumber,
              teamId: recurring.teamId,
              customerName: recurring.customerName ?? undefined,
              recurringId: recurring.id,
              recurringSequence: nextSequence,
              recurringTotalCount: recurring.endCount ?? undefined,
            },
            {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            },
          );

          // If series is now completed, queue completion notification
          if (updatedRecurring?.status === "completed") {
            await invoicesQueue.add(
              "invoice-notification",
              {
                type: "recurring_series_completed",
                invoiceId,
                invoiceNumber,
                teamId: recurring.teamId,
                customerName: recurring.customerName ?? undefined,
                recurringId: recurring.id,
                recurringSequence: nextSequence,
                recurringTotalCount: recurring.endCount ?? undefined,
              },
              {
                attempts: 3,
                backoff: {
                  type: "exponential",
                  delay: 1000,
                },
              },
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
          // Note: The invoice exists with status "unpaid" but without a PDF.
          // It will appear in the dashboard where the user can manually send it.
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error("Failed to generate recurring invoice", {
          recurringId: recurring.id,
          error: errorMessage,
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
            },
          );

          // Queue notification for auto-pause
          await invoicesQueue.add(
            "invoice-notification",
            {
              type: "recurring_series_paused",
              invoiceId: recurring.id, // Use recurring ID as placeholder
              invoiceNumber: `Recurring-${recurring.id.slice(0, 8)}`,
              teamId: recurring.teamId,
              customerName: recurring.customerName ?? undefined,
              recurringId: recurring.id,
            },
            {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            },
          );
        }

        errors.push({
          recurringId: recurring.id,
          error: errorMessage,
        });
        failed++;
      }
    }

    this.logger.info("Recurring invoice scheduler completed", {
      processed,
      skipped,
      failed,
      total: dueRecurring.length,
    });

    return {
      processed,
      skipped,
      failed,
      results,
      errors,
    };
  }
}
