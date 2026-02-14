import {
  createInbox,
  getInboxByReferenceId,
  getRegistrationByPeppolId,
  groupRelatedInboxItems,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { fetchEntry, fetchEntryFile } from "@midday/e-invoice/client";
import { parseIncomingGOBL } from "@midday/e-invoice/incoming";
import { findPdfAttachment } from "@midday/e-invoice/parsers";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import type { PeppolIncomingPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

export class PeppolIncomingProcessor extends BaseProcessor<PeppolIncomingPayload> {
  async process(job: Job<PeppolIncomingPayload>): Promise<void> {
    const { siloEntryId, key } = job.data;

    this.logger.info("Processing incoming Peppol document", {
      jobId: job.id,
      siloEntryId,
      key,
    });

    const apiKey = process.env.INVOPOP_API_KEY;

    if (!apiKey) {
      this.logger.error("INVOPOP_API_KEY not configured");
      throw new Error("INVOPOP_API_KEY not configured");
    }

    const db = getDb();
    const supabase = createClient();

    // Step 1: Fetch the silo entry from Invopop
    const entry = await fetchEntry(apiKey, siloEntryId);

    if (!entry) {
      throw new Error(`Silo entry not found: ${siloEntryId}`);
    }

    // Step 2: Parse the GOBL document
    const parsed = parseIncomingGOBL(entry);

    if (!parsed) {
      this.logger.warn("Silo entry does not contain a valid bill/invoice", {
        siloEntryId,
        docSchema: entry.doc_schema,
      });
      return;
    }

    this.logger.info("Parsed incoming GOBL invoice", {
      siloEntryId,
      supplierName: parsed.supplierName,
      customerPeppolId: parsed.customerPeppolId,
      invoiceNumber: parsed.invoiceNumber,
      amount: parsed.amount,
      currency: parsed.currency,
    });

    // Step 3: Find the team by customer Peppol ID
    if (!parsed.customerPeppolId) {
      this.logger.warn(
        "Incoming document has no customer Peppol ID, cannot route to team",
        { siloEntryId },
      );
      return;
    }

    // The DB stores peppolId as just the code (e.g. "0316597904") from
    // extractPeppolId, but GOBL inboxes include scheme:code (e.g. "0208:0316597904").
    // Try the full value first, then fall back to just the code portion.
    let registration = await getRegistrationByPeppolId(db, {
      peppolId: parsed.customerPeppolId,
    });

    if (!registration && parsed.customerPeppolId.includes(":")) {
      const codeOnly = parsed.customerPeppolId.split(":")[1]!;
      registration = await getRegistrationByPeppolId(db, {
        peppolId: codeOnly,
      });
    }

    if (!registration) {
      this.logger.warn("No registered team found for customer Peppol ID", {
        customerPeppolId: parsed.customerPeppolId,
        siloEntryId,
      });
      return;
    }

    const teamId = registration.teamId;

    this.logger.info("Matched incoming document to team", {
      teamId,
      peppolId: parsed.customerPeppolId,
      siloEntryId,
    });

    // Step 4: Deduplicate — bail early before any expensive I/O if this
    // document was already ingested (e.g. duplicate webhook delivery).
    const referenceId = `peppol_${siloEntryId}`;
    const existingInbox = await getInboxByReferenceId(db, {
      referenceId,
      teamId,
    });

    if (existingInbox) {
      this.logger.info(
        "Inbox item already exists for this Peppol document, skipping duplicate",
        {
          referenceId,
          inboxId: existingInbox.id,
          status: existingInbox.status,
        },
      );
      return;
    }

    // Step 5: Get PDF from Invopop
    const pdfAttachment = findPdfAttachment(entry);

    if (!pdfAttachment) {
      // Invopop's receive workflow generates a PDF asynchronously — it may
      // not be attached yet when this job first runs.  Throw so BullMQ
      // retries with back-off until the PDF becomes available.
      this.logger.warn("No PDF attachment found in silo entry, will retry", {
        siloEntryId,
        attempt: job.attemptsMade,
      });
      throw new Error(
        `PDF attachment not yet available for silo entry ${siloEntryId}`,
      );
    }

    this.logger.info("Downloading PDF from Invopop", {
      fileId: pdfAttachment.id,
      fileName: pdfAttachment.name,
    });

    const pdfBuffer = await fetchEntryFile(apiKey, entry.id, pdfAttachment.id);

    // Step 6: Upload PDF to storage
    const fileName = `peppol_${siloEntryId}.pdf`;
    const filePath = [teamId, "inbox", fileName];
    const filePathStr = filePath.join("/");

    this.logger.info("Uploading PDF to storage", {
      filePath: filePathStr,
      fileSize: pdfBuffer.byteLength,
    });

    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(filePathStr, new Uint8Array(pdfBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      this.logger.error("Failed to upload PDF to storage", {
        error: uploadError.message,
        filePath: filePathStr,
      });
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Step 7: Create inbox item
    const inboxData = await createInbox(db, {
      displayName: parsed.supplierName,
      teamId,
      filePath,
      fileName,
      contentType: "application/pdf",
      size: pdfBuffer.byteLength,
      referenceId,
      senderEmail: parsed.supplierEmail ?? undefined,
      meta: {
        source: "peppol",
        sourceMetadata: {
          siloEntryId,
          supplierVat: parsed.supplierVat,
          supplierPeppolId: parsed.supplierPeppolId,
          invoiceNumber: parsed.invoiceNumber,
        },
      },
      status: "processing",
    });

    if (!inboxData) {
      // createInbox should always return a row (it fetches the existing one on
      // conflict).  If it somehow doesn't, bail — the dedup check above
      // already guarantees we won't reach here under normal conditions.
      this.logger.warn("createInbox returned no data", { referenceId });
      return;
    }

    this.logger.info("Created inbox item", {
      inboxId: inboxData.id,
      teamId,
      referenceId,
    });

    // Step 8: Update inbox with extracted data (skip OCR — GOBL is authoritative)
    await updateInboxWithProcessedData(db, {
      id: inboxData.id,
      amount: parsed.amount ?? undefined,
      currency: parsed.currency ?? undefined,
      displayName: parsed.supplierName,
      date: parsed.date ?? undefined,
      invoiceNumber: parsed.invoiceNumber ?? undefined,
      type: "expense",
      status: "analyzing",
    });

    // Group related inbox items
    try {
      await groupRelatedInboxItems(db, {
        inboxId: inboxData.id,
        teamId,
      });
    } catch (error) {
      this.logger.error("Failed to group related inbox items", {
        inboxId: inboxData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Step 9: Trigger document classification
    await triggerJob(
      "process-document",
      {
        mimetype: "application/pdf",
        filePath,
        teamId,
      },
      "documents",
    );

    // Step 10: Trigger embedding and wait for completion
    this.logger.info("Triggering embed-inbox job", {
      inboxId: inboxData.id,
      teamId,
    });

    await triggerJobAndWait(
      "embed-inbox",
      {
        inboxId: inboxData.id,
        teamId,
      },
      "embeddings",
      { timeout: 60000 },
    );

    // Step 11: Trigger matching
    await triggerJob(
      "batch-process-matching",
      {
        teamId,
        inboxIds: [inboxData.id],
      },
      "inbox",
    );

    // Send in-app notification — fire and forget
    const notifications = new Notifications(db);

    notifications
      .create("e_invoice_received", teamId, {
        supplierName: parsed.supplierName,
        invoiceNumber: parsed.invoiceNumber ?? undefined,
        amount: parsed.amount ?? undefined,
        currency: parsed.currency ?? undefined,
      })
      .catch((err) =>
        this.logger.warn("Failed to send e-invoice received notification", {
          teamId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );

    this.logger.info("Incoming Peppol document processed successfully", {
      inboxId: inboxData.id,
      teamId,
      supplierName: parsed.supplierName,
      amount: parsed.amount,
    });
  }
}
