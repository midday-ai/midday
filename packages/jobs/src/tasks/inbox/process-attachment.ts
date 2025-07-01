import { processAttachmentSchema } from "@jobs/schema";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { convertHeic } from "../document/convert-heic";
import { processDocument } from "../document/process-document";

export const processAttachment = schemaTask({
  id: "process-attachment",
  schema: processAttachmentSchema,
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
    factor: 2,
    randomize: true,
  },
  queue: {
    concurrencyLimit: 100,
  },
  run: async ({ teamId, mimetype, size, filePath, referenceId, website }) => {
    const supabase = createClient();

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      await convertHeic.triggerAndWait({
        filePath,
      });
    }

    const filename = filePath.at(-1);

    // Check if inbox item already exists (for retry scenarios)
    let inboxData = null;

    const { data: existingInbox } = await supabase
      .from("inbox")
      .select("*")
      .eq("file_path", filePath)
      .eq("team_id", teamId)
      .single();

    inboxData = existingInbox;

    // Only create new inbox item if it doesn't exist
    if (!inboxData) {
      const { data: newInboxData } = await supabase
        .from("inbox")
        .insert({
          // NOTE: If we can't parse the name using OCR this will be the fallback name
          display_name: filename,
          team_id: teamId,
          file_path: filePath,
          file_name: filename,
          content_type: mimetype,
          size,
          reference_id: referenceId,
          website,
        })
        .select("*")
        .single()
        .throwOnError();

      inboxData = newInboxData;
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
      const document = new DocumentClient();

      logger.info("Starting document processing", {
        inboxId: inboxData.id,
        mimetype,
        referenceId,
      });

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        mimetype,
      });

      logger.info("Document processing completed", {
        inboxId: inboxData.id,
        resultType: result.type,
        hasAmount: !!result.amount,
      });

      await supabase
        .from("inbox")
        .update({
          amount: result.amount,
          currency: result.currency,
          display_name: result.name ?? undefined,
          website: result.website ?? undefined,
          date: result.date,
          tax_amount: result.tax_amount,
          tax_rate: result.tax_rate,
          tax_type: result.tax_type,
          type: result.type as "invoice" | "expense" | null | undefined,
          status: "pending",
        })
        .eq("id", inboxData.id)
        .select()
        .single();

      // NOTE: Process documents and images for classification
      await processDocument.trigger({
        mimetype,
        filePath,
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

      await supabase
        .from("inbox")
        .update({ status: "pending" })
        .eq("id", inboxData.id);
    }
  },
});
