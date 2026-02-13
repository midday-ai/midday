import {
  getCustomerById,
  getEInvoiceRegistration,
  getInvoiceById,
  getTeamById,
  updateInvoice,
} from "@midday/db/queries";
import { createEntry, createJob } from "@midday/e-invoice/client";
import type { MiddayInvoiceData, MiddayLineItem } from "@midday/e-invoice/gobl";
import {
  invoiceKey,
  toGOBL,
  validateEInvoiceRequirements,
} from "@midday/e-invoice/gobl";
import type { Job } from "bullmq";

import type { SubmitEInvoicePayload } from "../../schemas/invoices";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Submit E-Invoice Processor
 * Transforms a Midday invoice into GOBL format and submits it
 * to Invopop for e-invoicing compliance.
 */
export class SubmitEInvoiceProcessor extends BaseProcessor<SubmitEInvoicePayload> {
  async process(job: Job<SubmitEInvoicePayload>): Promise<void> {
    const { invoiceId } = job.data;
    const db = getDb();

    this.logger.info("Starting e-invoice submission", {
      jobId: job.id,
      invoiceId,
    });

    // Fetch invoice with all related data
    const invoice = await getInvoiceById(db, { id: invoiceId });

    if (!invoice) {
      this.logger.error("Invoice not found", { invoiceId });
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Fetch team for e-invoice settings and company data
    const team = await getTeamById(db, invoice.teamId);

    if (!team) {
      this.logger.error("Team not found", { teamId: invoice.teamId });
      throw new Error(`Team not found: ${invoice.teamId}`);
    }

    // Check if platform e-invoicing is configured
    const apiKey = process.env.INVOPOP_API_KEY;
    const workflowId = process.env.INVOPOP_WORKFLOW_ID;

    if (!apiKey || !workflowId) {
      this.logger.info("Invopop platform not configured, skipping e-invoice", {
        invoiceId,
        hasApiKey: !!apiKey,
        hasWorkflowId: !!workflowId,
      });
      return;
    }

    // Check if team has complete company data for e-invoicing
    if (!team.addressLine1 || !team.vatNumber || !team.countryCode) {
      this.logger.info(
        "Team missing required company data for e-invoicing, skipping",
        {
          invoiceId,
          teamId: team.id,
          hasAddress: !!team.addressLine1,
          hasVat: !!team.vatNumber,
          hasCountry: !!team.countryCode,
        },
      );
      return;
    }

    // Check Peppol registration status
    const registration = await getEInvoiceRegistration(db, {
      teamId: team.id,
      provider: "peppol",
    });

    if (!registration || registration.status !== "registered") {
      this.logger.info("Team not registered for Peppol, skipping e-invoice", {
        invoiceId,
        teamId: team.id,
      });
      return;
    }

    // Fetch customer data
    const customer = invoice.customerId
      ? await getCustomerById(db, {
          id: invoice.customerId,
          teamId: invoice.teamId,
        })
      : null;

    if (!customer) {
      this.logger.error("Customer not found", {
        invoiceId,
        customerId: invoice.customerId,
      });
      throw new Error(`Customer not found for invoice: ${invoiceId}`);
    }

    // Build line items from invoice data
    const rawLineItems =
      (invoice.lineItems as Record<string, unknown>[] | null) ?? [];
    const lineItems: MiddayLineItem[] = rawLineItems.map((item) => ({
      name: String(item.name ?? ""),
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
      unit: item.unit ? String(item.unit) : undefined,
      taxRate: item.taxRate != null ? Number(item.taxRate) : undefined,
      vat: item.vat != null ? Number(item.vat) : undefined,
      tax: item.tax != null ? Number(item.tax) : undefined,
    }));

    // Build the Midday invoice data structure
    const invoiceData: MiddayInvoiceData = {
      id: invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      lineItems,
      team: {
        name: team.name,
        email: team.email,
        countryCode: team.countryCode,
        addressLine1: team.addressLine1,
        addressLine2: team.addressLine2,
        city: team.city,
        state: team.state,
        zip: team.zip,
        vatNumber: team.vatNumber,
        taxId: team.taxId,
        peppolId: team.peppolId,
      },
      customer: {
        name: customer.name,
        email: customer.email,
        countryCode: customer.countryCode,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        vatNumber: customer.vatNumber,
        peppolId: customer.peppolId,
      },
      // Pass supplier Peppol registration info for GOBL inboxes
      supplierRegistration: registration.peppolId
        ? {
            peppolId: registration.peppolId,
            peppolScheme: registration.peppolScheme,
          }
        : null,
    };

    // Validate requirements
    const issues = validateEInvoiceRequirements(invoiceData);
    if (issues.length > 0) {
      this.logger.warn("E-invoice validation issues", {
        invoiceId,
        issues,
      });

      await updateInvoice(db, {
        id: invoiceId,
        teamId: team.id,
        eInvoiceStatus: "error",
        eInvoiceFaults: issues.map((i) => ({
          message: `${i.field}: ${i.message}`,
        })),
      });
      return;
    }

    // Transform to GOBL
    const goblInvoice = toGOBL(invoiceData);
    const key = invoiceKey(invoiceId);

    this.logger.info("GOBL invoice built, submitting to Invopop", {
      invoiceId,
      key,
      regime: goblInvoice.$regime,
    });

    // Update status to processing
    await updateInvoice(db, {
      id: invoiceId,
      teamId: team.id,
      eInvoiceStatus: "processing",
    });

    try {
      // Step 1: Create silo entry (synchronous validation + storage)
      const entry = await createEntry(
        apiKey,
        goblInvoice as unknown as Record<string, unknown>,
        key,
      );

      this.logger.info("Silo entry created", {
        invoiceId,
        entryId: entry.id,
        state: entry.state,
      });

      // Step 2: Create job to run workflow
      const transformJob = await createJob(apiKey, workflowId, entry.id, key);

      this.logger.info("Transform job created", {
        invoiceId,
        jobId: transformJob.id,
        workflowId,
      });

      // Store the Invopop IDs for tracking via webhook
      await updateInvoice(db, {
        id: invoiceId,
        teamId: team.id,
        eInvoiceSiloEntryId: entry.id,
        eInvoiceJobId: transformJob.id,
      });
    } catch (error) {
      this.logger.error("Failed to submit e-invoice to Invopop", {
        invoiceId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Store the error on the invoice
      await updateInvoice(db, {
        id: invoiceId,
        teamId: team.id,
        eInvoiceStatus: "error",
        eInvoiceFaults: [
          {
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      });

      throw error;
    }

    this.logger.info("E-invoice submission completed", { invoiceId });
  }
}
