import { getDb } from "@jobs/init";
import { processAttachmentSchema } from "@jobs/schema";
import {
  createInbox,
  getInboxByFilePath,
  getTeamById,
  groupRelatedInboxItems,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask, tasks } from "@trigger.dev/sdk";
import { convertHeic } from "../document/convert-heic";
import { processDocument } from "../document/process-document";
import { embedInbox } from "./embed-inbox";

export const processAttachment = schemaTask({
  id: "process-attachment",
  schema: processAttachmentSchema,
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
    factor: 2,
    randomize: true,
  },
  queue: {
    concurrencyLimit: 50,
  },
  run: async ({
    teamId,
    mimetype,
    size,
    filePath,
    referenceId,
    website,
    senderEmail,
    inboxAccountId,
  }) => {
    const supabase = createClient();
    const filename = filePath.at(-1);

    // Check if inbox item already exists (for retry scenarios or manual uploads)
    let inboxData = await getInboxByFilePath(getDb(), {
      filePath,
      teamId,
    });

    logger.info("Processing attachment", {
      filePath: filePath.join("/"),
      existingItem: !!inboxData,
      existingStatus: inboxData?.status,
      teamId,
      mimetype,
    });

    // Convert HEIC to JPEG if needed (do this early so we can update contentType immediately)
    let effectiveMimetype = mimetype;
    if (mimetype === "image/heic") {
      logger.info("Converting HEIC to JPEG", { filePath: filePath.join("/") });
      await convertHeic.triggerAndWait({ filePath });
      effectiveMimetype = "image/jpeg";

      // Update contentType immediately if item exists (so frontend can show image sooner)
      if (inboxData && inboxData.contentType === "image/heic") {
        await updateInbox(getDb(), {
          id: inboxData.id,
          teamId,
          contentType: "image/jpeg",
        });
        logger.info("Updated contentType to jpeg", { inboxId: inboxData.id });
      }
    }

    // Create inbox item if it doesn't exist (for non-manual uploads)
    // or update existing item status if it was created manually
    if (!inboxData) {
      logger.info("Creating new inbox item", { filePath: filePath.join("/") });
      inboxData = await createInbox(getDb(), {
        // NOTE: If we can't parse the name using OCR this will be the fallback name
        displayName: filename ?? "Unknown",
        teamId,
        filePath,
        fileName: filename ?? "Unknown",
        contentType: effectiveMimetype,
        size,
        referenceId,
        website,
        senderEmail,
        inboxAccountId,
        status: "processing",
      });
    } else if (
      inboxData.status === "processing" ||
      inboxData.status === "new"
    ) {
      // Check if item is stuck (processing for more than 5 minutes)
      const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
      const createdAt = inboxData.createdAt
        ? new Date(inboxData.createdAt).getTime()
        : null;
      const now = Date.now();
      const isStuck = createdAt && now - createdAt > STUCK_THRESHOLD_MS;

      if (isStuck) {
        logger.warn("Found stuck inbox item, recovering", {
          inboxId: inboxData.id,
          filePath: filePath.join("/"),
          status: inboxData.status,
          ageMinutes: createdAt ? Math.round((now - createdAt) / 60000) : null,
        });
      } else {
        logger.info("Found existing inbox item in processing status", {
          inboxId: inboxData.id,
          filePath: filePath.join("/"),
          status: inboxData.status,
        });
      }
    } else {
      logger.info("Found existing inbox item with status", {
        inboxId: inboxData.id,
        status: inboxData.status,
        filePath: filePath.join("/"),
      });
    }

    if (!inboxData) {
      throw Error("Inbox data not found");
    }

    const { data } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!data) {
      throw Error("File not found");
    }

    try {
      // Fetch team data to provide context for OCR extraction
      const teamData = await getTeamById(getDb(), teamId);

      const document = new DocumentClient();

      logger.info("Starting document processing", {
        inboxId: inboxData.id,
        mimetype: effectiveMimetype,
        originalMimetype: mimetype,
        referenceId,
        teamName: teamData?.name,
      });

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        mimetype: effectiveMimetype, // Use effective mimetype (jpeg if converted from heic)
        companyName: teamData?.name,
      });

      logger.info("Document processing completed", {
        inboxId: inboxData.id,
        resultType: result.type,
        hasAmount: !!result.amount,
      });

      await updateInboxWithProcessedData(getDb(), {
        id: inboxData.id,
        amount: result.amount ?? undefined,
        currency: result.currency ?? undefined,
        displayName: result.name ?? undefined,
        website: result.website ?? undefined,
        date: result.date ?? undefined,
        taxAmount: result.tax_amount ?? undefined,
        taxRate: result.tax_rate ?? undefined,
        taxType: result.tax_type ?? undefined,
        type: result.type as "invoice" | "expense" | null | undefined,
        invoiceNumber: result.invoice_number ?? undefined,
        status: "analyzing", // Keep analyzing until matching is complete
      });

      // Group related inbox items after storing invoice number
      try {
        await groupRelatedInboxItems(getDb(), {
          inboxId: inboxData.id,
          teamId,
        });
      } catch (error) {
        logger.error("Failed to group related inbox items", {
          inboxId: inboxData.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Don't fail the entire process if grouping fails
      }

      // NOTE: Process documents and images for classification
      await processDocument.trigger({
        mimetype: effectiveMimetype, // Use effective mimetype (jpeg if converted from heic)
        filePath,
        teamId,
      });

      // Create embedding and wait for completion
      await embedInbox.triggerAndWait({
        inboxId: inboxData.id,
        teamId,
      });

      logger.info("Inbox embedding completed", {
        inboxId: inboxData.id,
        teamId,
      });

      // After embedding is complete, trigger efficient matching
      await tasks.trigger("batch-process-matching", {
        teamId,
        inboxIds: [inboxData.id],
      });

      logger.info("Triggered efficient inbox matching", {
        inboxId: inboxData.id,
        teamId,
      });
    } catch (error) {
      logger.error("Document processing failed", {
        inboxId: inboxData.id,
        error: error instanceof Error ? error.message : "Unknown error",
        referenceId,
        mimetype: effectiveMimetype,
        originalMimetype: mimetype,
      });

      // Re-throw timeout errors to trigger retry
      if (error instanceof Error && error.name === "AbortError") {
        logger.warn(
          "Document processing failed with retryable error, will retry",
          {
            inboxId: inboxData.id,
            referenceId,
            errorType: error.name,
            errorMessage: error.message,
          },
        );
        throw error;
      }

      // For non-retryable errors, mark as pending with fallback name
      logger.info(
        "Document processing failed, marking as pending with fallback name",
        {
          inboxId: inboxData.id,
          referenceId,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      );

      await updateInbox(getDb(), {
        id: inboxData.id,
        teamId,
        status: "pending",
      });
    }
  },
});
