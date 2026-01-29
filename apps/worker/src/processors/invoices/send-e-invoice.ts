import {
  getCustomerById,
  getInvoiceById,
  getTeamById,
  updateInvoice,
} from "@midday/db/queries";
import {
  type MiddayInvoiceData,
  createDDDClient,
  sendViaPeppol,
  transformToDDDInvoice,
  validateForPeppol,
} from "@midday/e-invoice";
import type { LineItem } from "@midday/invoice/types";
import type { Job } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../config/job-options";
import { invoicesQueue } from "../../queues/invoices";
import { notificationsQueue } from "../../queues/notifications";
import {
  type SendEInvoicePayload,
  sendEInvoiceSchema,
} from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Send E-Invoice Processor
 * Handles sending invoices via the Peppol network using DDD Invoices API
 *
 * Flow:
 * 1. Fetch invoice, customer, and team data
 * 2. Validate that all required e-invoice fields are present
 * 3. Transform to DDD Invoices format
 * 4. Send via Peppol network
 * 5. Update invoice with e-invoice status
 * 6. On failure, fall back to email delivery
 */
export class SendEInvoiceProcessor extends BaseProcessor<SendEInvoicePayload> {
  protected getPayloadSchema() {
    return sendEInvoiceSchema;
  }

  async process(job: Job<SendEInvoicePayload>): Promise<void> {
    const { invoiceId, sendNotificationEmail } = job.data;
    const db = getDb();

    this.logger.info("Starting e-invoice delivery", {
      jobId: job.id,
      invoiceId,
      sendNotificationEmail,
    });

    // Fetch invoice data
    const invoice = await getInvoiceById(db, { id: invoiceId });
    if (!invoice) {
      this.logger.error("Invoice not found", { invoiceId });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Fetch full customer data (including e-invoice fields)
    if (!invoice.customerId) {
      this.logger.error("Invoice has no customer", { invoiceId });
      await this.fallbackToEmail(invoiceId, invoice.teamId, "No customer");
      return;
    }

    const customer = await getCustomerById(db, {
      id: invoice.customerId,
      teamId: invoice.teamId,
    });
    if (!customer) {
      this.logger.error("Customer not found", {
        invoiceId,
        customerId: invoice.customerId,
      });
      await this.fallbackToEmail(
        invoiceId,
        invoice.teamId,
        "Customer not found",
      );
      return;
    }

    // Fetch team data
    const team = await getTeamById(db, invoice.teamId);
    if (!team) {
      this.logger.error("Team not found", {
        invoiceId,
        teamId: invoice.teamId,
      });
      await this.fallbackToEmail(invoiceId, invoice.teamId, "Team not found");
      return;
    }

    // Check if e-invoice API key is configured (platform-level)
    const connectionKey = process.env.DDD_INVOICES_API_KEY;
    if (!connectionKey) {
      this.logger.error("DDD_INVOICES_API_KEY environment variable not set");
      await this.fallbackToEmail(
        invoiceId,
        invoice.teamId,
        "E-invoice service not configured",
      );
      return;
    }

    // Check if customer has Peppol ID
    const peppolId = customer.peppolId;
    if (!peppolId) {
      this.logger.warn("Customer has no Peppol ID", {
        invoiceId,
        customerId: customer.id,
      });
      await this.fallbackToEmail(invoiceId, invoice.teamId, "No Peppol ID");
      return;
    }

    // Prepare data for transformation
    const middayData: MiddayInvoiceData = {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        vat: invoice.vat,
        tax: invoice.tax,
        currency: invoice.currency,
        note: invoice.note,
        lineItems: (invoice.lineItems as LineItem[]) || [],
      },
      customer: {
        name: customer.name,
        email: customer.email,
        countryCode: customer.countryCode,
        vatNumber: customer.vatNumber,
        peppolId: peppolId,
        registrationNumber: customer.registrationNumber,
        legalForm: customer.legalForm,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2,
        city: customer.city,
        zip: customer.zip,
        country: customer.country,
      },
      team: {
        name: team.name,
        countryCode: team.countryCode,
        taxId: team.taxId,
        peppolId: team.peppolId,
        registrationNumber: team.registrationNumber,
        addressLine1: team.addressLine1,
        addressLine2: team.addressLine2,
        city: team.city,
        zip: team.zip,
      },
    };

    // Validate data for Peppol
    const validation = validateForPeppol(middayData);
    if (!validation.valid) {
      this.logger.error("E-invoice validation failed", {
        invoiceId,
        errors: validation.errors,
      });
      await this.fallbackToEmail(
        invoiceId,
        invoice.teamId,
        `Validation failed: ${validation.errors.join(", ")}`,
      );
      return;
    }

    // Update invoice status to pending
    await updateInvoice(db, {
      id: invoiceId,
      teamId: invoice.teamId,
      eInvoiceStatus: "pending",
    });

    try {
      // Create DDD client and send via Peppol
      const client = createDDDClient({ connectionKey });
      const dddInvoice = transformToDDDInvoice(middayData);

      this.logger.info("Sending invoice via Peppol", {
        invoiceId,
        buyerName: dddInvoice.BuyerName,
        buyerId: dddInvoice.BuyerId,
        amount: dddInvoice.DocTotalAmount,
        currency: dddInvoice.DocCurrencyCode,
      });

      const result = await sendViaPeppol(client, dddInvoice);

      // Update invoice with success status
      await updateInvoice(db, {
        id: invoiceId,
        teamId: invoice.teamId,
        eInvoiceId: result.invoiceId,
        eInvoiceStatus: "sent",
        eInvoiceSentAt: new Date().toISOString(),
        eInvoiceError: null,
      });

      this.logger.info("E-invoice sent successfully", {
        invoiceId,
        dddInvoiceId: result.invoiceId,
        peppolXmlUrl: result.peppolXmlUrl,
      });

      // Queue notification email if enabled
      if (sendNotificationEmail && customer.email) {
        await notificationsQueue.add(
          "notification",
          {
            type: "e_invoice_sent",
            invoiceId,
            invoiceNumber: invoice.invoiceNumber!,
            teamId: invoice.teamId,
            customerName: customer.name,
            customerEmail: customer.email,
          },
          DEFAULT_JOB_OPTIONS,
        );

        this.logger.debug("Queued e-invoice notification email", { invoiceId });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if this is the last retry attempt
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts?.attempts ?? 1;
      const isLastAttempt = attemptsMade >= maxAttempts;

      this.logger.error("E-invoice delivery failed", {
        invoiceId,
        error: errorMessage,
        attemptsMade,
        maxAttempts,
        isLastAttempt,
      });

      if (isLastAttempt) {
        // Update invoice with permanent failure status
        await updateInvoice(db, {
          id: invoiceId,
          teamId: invoice.teamId,
          eInvoiceStatus: "failed",
          eInvoiceError: `Failed after ${attemptsMade} attempts: ${errorMessage}`,
        });

        // Fall back to email delivery only after all retries exhausted
        await this.fallbackToEmail(invoiceId, invoice.teamId, errorMessage);
      } else {
        // Update invoice status to show retry in progress
        await updateInvoice(db, {
          id: invoiceId,
          teamId: invoice.teamId,
          eInvoiceStatus: "retrying",
          eInvoiceError: `Attempt ${attemptsMade}/${maxAttempts} failed: ${errorMessage}`,
        });

        // Re-throw to let BullMQ retry with exponential backoff
        throw error;
      }
    }
  }

  /**
   * Fall back to email delivery when e-invoice fails
   */
  private async fallbackToEmail(
    invoiceId: string,
    teamId: string,
    reason: string,
  ): Promise<void> {
    this.logger.info("Falling back to email delivery", {
      invoiceId,
      reason,
    });

    const db = getDb();

    // Get invoice to find file path
    const invoice = await getInvoiceById(db, { id: invoiceId });
    if (!invoice?.filePath) {
      this.logger.error("Cannot fall back to email: invoice has no file path", {
        invoiceId,
      });
      return;
    }

    const filename = invoice.filePath[invoice.filePath.length - 1];
    const fullPath = invoice.filePath.join("/");

    // Queue email delivery
    await invoicesQueue.add(
      "send-invoice-email",
      {
        invoiceId,
        filename: filename!,
        fullPath,
      },
      DEFAULT_JOB_OPTIONS,
    );

    this.logger.info("Queued fallback email delivery", { invoiceId });
  }
}
