import {
  getCustomerById,
  getEInvoiceRegistration,
  getInvoiceById,
  getTeamById,
  updateInvoice,
} from "@midday/db/queries";
import {
  createEntry,
  createJob,
  fetchEntryByKey,
  isConflictError,
} from "@midday/e-invoice/client";
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

    // Guard: skip if a prior submission already reached a terminal or in-flight state.
    // Retries or duplicate triggers must not regress a "sent" invoice back to
    // "processing" / "error", and must not re-submit while already in flight.
    if (
      invoice.eInvoiceStatus === "sent" ||
      invoice.eInvoiceStatus === "processing"
    ) {
      this.logger.info(
        "E-invoice already sent or processing, skipping duplicate submission",
        { invoiceId, currentStatus: invoice.eInvoiceStatus },
      );
      return;
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

    // Skip e-invoice delivery when the customer has no Peppol ID.
    // This is an email-only customer — not an error condition.
    if (!customer.peppolId) {
      this.logger.info(
        "Customer has no Peppol ID, skipping e-invoice delivery",
        {
          invoiceId,
          customerId: customer.id,
        },
      );
      return;
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
          message: i.message,
          code: i.field,
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

    try {
      // Step 1: Create silo entry (synchronous validation + storage)
      let entry: Awaited<ReturnType<typeof createEntry>>;

      try {
        entry = await createEntry(apiKey, goblInvoice, key, "invoices");

        this.logger.info("Silo entry created", {
          invoiceId,
          entryId: entry.id,
          state: entry.state,
        });
      } catch (entryError) {
        if (isConflictError(entryError)) {
          // Entry already exists for this key (retry / duplicate trigger).
          // Fetch the existing entry so we can still attempt to create the job.
          this.logger.warn(
            "Silo entry already exists (409 conflict), fetching existing entry",
            { invoiceId, key },
          );
          entry = await fetchEntryByKey(apiKey, key);
        } else {
          throw entryError;
        }
      }

      // Step 2: Mark as processing before job creation so state is consistent
      // even if the process crashes between job creation and DB update.
      // The conflict handler (409) below is safe because it won't regress status.
      await updateInvoice(db, {
        id: invoiceId,
        teamId: team.id,
        eInvoiceStatus: "processing",
        eInvoiceSiloEntryId: entry.id,
      });

      // Step 3: Create job to run workflow
      try {
        const transformJob = await createJob(apiKey, workflowId, entry.id, key);

        this.logger.info("Transform job created", {
          invoiceId,
          jobId: transformJob.id,
          workflowId,
        });

        // Store the job ID now that we have it
        await updateInvoice(db, {
          id: invoiceId,
          teamId: team.id,
          eInvoiceJobId: transformJob.id,
        });
      } catch (jobError) {
        if (isConflictError(jobError)) {
          // Job already exists for this key — the submission is already in
          // flight. Store the entry ID but do NOT touch the status; the
          // webhook will reconcile the final state. Overwriting here would
          // regress a "sent" status back to "processing" on retries.
          this.logger.warn(
            "Transform job already exists (409 conflict), submission already in progress",
            { invoiceId, key, entryId: entry.id },
          );

          await updateInvoice(db, {
            id: invoiceId,
            teamId: team.id,
            eInvoiceSiloEntryId: entry.id,
          });
        } else {
          throw jobError;
        }
      }
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
            provider: "invopop",
          },
        ],
      });

      throw error;
    }

    this.logger.info("E-invoice submission completed", { invoiceId });
  }
}
