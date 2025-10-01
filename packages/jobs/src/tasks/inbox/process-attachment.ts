import { getDb } from "@jobs/init";
import { processAttachmentSchema } from "@jobs/schema";
import {
  createInbox,
  getInboxByFilePath,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { getTeamById } from "@midday/db/queries";
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
    inboxAccountId,
  }) => {
    const supabase = createClient();

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      await convertHeic.triggerAndWait({
        filePath,
      });
    }

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
    });

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
        contentType: mimetype,
        size,
        referenceId,
        website,
        inboxAccountId,
        status: "processing", // Set as processing when created by job
      });
    } else if (inboxData.status === "processing") {
      logger.info("Found existing inbox item already in processing status", {
        inboxId: inboxData.id,
        filePath: filePath.join("/"),
      });
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
        mimetype,
        referenceId,
        teamName: teamData?.name,
      });

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        mimetype,
        companyName: teamData?.name,
      });

      logger.info("Document processing completed", {
        inboxId: inboxData.id,
        resultType: result.type,
        hasAmount: !!result.amount,
      });

      await updateInboxWithProcessedData(getDb(), {
        id: inboxData.id,
        amount: result.amount,
        currency: result.currency,
        displayName: result.name,
        website: result.website,
        date: result.date,
        taxAmount: result.tax_amount,
        taxRate: result.tax_rate,
        taxType: result.tax_type,
        type: result.type as "invoice" | "expense" | null | undefined,
        status: "analyzing", // Keep analyzing until matching is complete
      });

      // NOTE: Process documents and images for classification
      await processDocument.trigger({
        mimetype,
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
        mimetype,
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
