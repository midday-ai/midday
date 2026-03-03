import {
  createWhatsAppClient,
  formatDocumentProcessedSuccess,
  formatProcessingErrorMessage,
  REACTION_EMOJIS,
} from "@midday/app-store/whatsapp/server";
import {
  createInbox,
  groupRelatedInboxItems,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import { getExtensionFromMimeType } from "@midday/utils";
import type { Job } from "bullmq";
import { format, parseISO } from "date-fns";
import { nanoid } from "nanoid";
import type { WhatsAppUploadPayload } from "../../schemas/inbox";
import { classifyFromExtraction } from "../../utils/classify-from-extraction";
import { getDb } from "../../utils/db";
import { NonRetryableError } from "../../utils/error-classification";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

export class WhatsAppUploadProcessor extends BaseProcessor<WhatsAppUploadPayload> {
  async process(job: Job<WhatsAppUploadPayload>): Promise<void> {
    const {
      teamId,
      phoneNumber,
      messageId,
      mediaId,
      mimeType,
      filename,
      caption,
    } = job.data;

    this.logger.info("Starting WhatsApp upload processing", {
      teamId,
      phoneNumber,
      messageId,
      mediaId,
      mimeType,
    });

    const supabase = createClient();
    const db = getDb();
    const whatsappClient = createWhatsAppClient();

    // Helper to update reaction
    const updateReaction = async (emoji: string) => {
      try {
        await whatsappClient.reactToMessage(phoneNumber, messageId, emoji);
      } catch (error) {
        this.logger.warn("Failed to update reaction", {
          phoneNumber,
          messageId,
          emoji,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    let inboxData: { id: string } | null | undefined = null;

    try {
      // Download media from WhatsApp
      this.logger.info("Downloading media from WhatsApp", {
        mediaId,
        mimeType,
      });

      const fileData = await whatsappClient.downloadMedia(mediaId);

      if (!fileData || fileData.byteLength === 0) {
        throw new NonRetryableError(
          "Failed to download media from WhatsApp or file is empty",
          undefined,
          "validation",
        );
      }

      const MAX_FILE_SIZE = 20 * 1024 * 1024;
      if (fileData.byteLength > MAX_FILE_SIZE) {
        throw new NonRetryableError(
          `File size (${(fileData.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (20MB)`,
          undefined,
          "validation",
        );
      }

      // Generate filename if not provided
      const baseFileName = filename || `whatsapp_${nanoid(8)}`;
      const hasExtension = /\.[^.]+$/.test(baseFileName);
      const finalFileName = hasExtension
        ? baseFileName
        : `${baseFileName}${getExtensionFromMimeType(mimeType)}`;

      const filePath = [teamId, "inbox", finalFileName];
      const filePathStr = filePath.join("/");

      // Upload file to storage
      this.logger.info("Uploading file to storage", {
        filePath: filePathStr,
        fileSize: fileData.byteLength,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("vault")
        .upload(filePathStr, new Uint8Array(fileData), {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        this.logger.error("Failed to upload file to storage", {
          error: uploadError.message,
          filePath: filePathStr,
        });
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (!uploadData) {
        throw new Error("File upload succeeded but no data returned");
      }

      this.logger.info("File uploaded successfully", {
        filePath: filePathStr,
        uploadPath: uploadData.path,
      });

      // Create inbox entry with source metadata
      inboxData = await createInbox(db, {
        displayName: caption || finalFileName,
        teamId,
        filePath,
        fileName: finalFileName,
        contentType: mimeType,
        size: fileData.byteLength,
        referenceId: `whatsapp_${mediaId}_${finalFileName}`,
        meta: {
          source: "whatsapp",
          sourceMetadata: {
            phoneNumber,
            messageId,
          },
        },
        status: "processing",
      });

      if (!inboxData) {
        throw new Error("Failed to create inbox entry");
      }

      this.logger.info("Created inbox entry", {
        inboxId: inboxData.id,
        teamId,
      });

      const pathForSignedUrl = uploadData.path || filePathStr;
      const { data: signedUrlData, error: signedUrlError } = await withTimeout(
        supabase.storage.from("vault").createSignedUrl(pathForSignedUrl, 600),
        TIMEOUTS.EXTERNAL_API,
        `Signed URL creation timed out after ${TIMEOUTS.EXTERNAL_API}ms`,
      );

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error(
          `Failed to create signed URL: ${signedUrlError?.message || "No URL returned"}`,
        );
      }

      const signedUrl = signedUrlData.signedUrl;

      // Process document with OCR
      const document = new DocumentClient();

      const result = await withTimeout(
        document.getInvoiceOrReceipt({
          documentUrl: signedUrl,
          mimetype: mimeType,
        }),
        TIMEOUTS.DOCUMENT_PROCESSING,
        `Document processing timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
      );

      // Check if document is classified as "other" (non-financial document)
      if (result.document_type === "other") {
        await updateInboxWithProcessedData(db, {
          id: inboxData.id,
          displayName: result.name ?? (caption || finalFileName),
          type: "other",
          status: "other",
        });

        this.logger.info(
          "Document classified as other (non-financial), skipping matching",
          {
            inboxId: inboxData.id,
          },
        );

        // Update reaction to indicate document received but not financial
        await updateReaction(REACTION_EMOJIS.SUCCESS);

        // Send message to WhatsApp about non-financial document
        try {
          await whatsappClient.sendMessage(
            phoneNumber,
            "This document doesn't appear to be an invoice or receipt. It has been saved to your inbox under 'Other' documents.",
          );
        } catch (error) {
          this.logger.warn(
            "Failed to send WhatsApp message for other document",
            {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
        }

        return; // Skip embedding and transaction matching for non-financial documents
      }

      // Update inbox with extracted data
      const updatedInbox = await updateInboxWithProcessedData(db, {
        id: inboxData.id,
        amount: result.amount ?? undefined,
        currency: result.currency ?? undefined,
        displayName: result.name ?? undefined,
        website: result.website ?? undefined,
        date: result.date ?? undefined,
        taxAmount: result.tax_amount ?? undefined,
        taxRate: result.tax_rate ?? undefined,
        taxType: result.tax_type ?? undefined,
        type: result.type ?? undefined,
        invoiceNumber: result.invoice_number ?? undefined,
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

      // Update reaction to success
      await updateReaction(REACTION_EMOJIS.SUCCESS);

      // Send extracted info back to WhatsApp
      if (updatedInbox?.amount) {
        try {
          const formatCurrencyAmount = (amount: number | null | undefined) => {
            if (!amount || !updatedInbox.currency) return undefined;
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: updatedInbox.currency,
            }).format(amount);
          };

          const documentType =
            updatedInbox.type === "invoice" ? "Invoice" : "Receipt";

          const formattedDate = updatedInbox.date
            ? format(parseISO(updatedInbox.date), "MMM d, yyyy")
            : undefined;

          const formattedAmount = formatCurrencyAmount(updatedInbox.amount);
          const formattedTaxAmount = updatedInbox.taxAmount
            ? formatCurrencyAmount(updatedInbox.taxAmount)
            : undefined;

          // Extract numeric amount and currency separately for the formatter
          const amountValue =
            formattedAmount?.replace(/[^\d.,]/g, "") || undefined;
          const taxAmountValue =
            formattedTaxAmount?.replace(/[^\d.,]/g, "") || undefined;

          const successMessage = formatDocumentProcessedSuccess({
            documentType,
            vendor: updatedInbox.displayName || undefined,
            date: formattedDate,
            amount: amountValue,
            currency: updatedInbox.currency || undefined,
            invoiceNumber:
              updatedInbox.type === "invoice" && updatedInbox.invoiceNumber
                ? updatedInbox.invoiceNumber
                : undefined,
            taxAmount: taxAmountValue,
            taxType: updatedInbox.taxType || undefined,
          });

          await whatsappClient.sendMessage(phoneNumber, successMessage);
        } catch (error) {
          this.logger.warn("Failed to send WhatsApp message", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      await classifyFromExtraction({
        filePath,
        teamId,
        title: result.title,
        summary: result.summary,
        tags: result.tags,
        content: result.content,
        date: result.date,
        language: result.language,
        documentType: result.document_type,
        vendorName: result.name,
        invoiceNumber: result.invoice_number,
        logger: this.logger,
      });

      try {
        const embedStartTime = Date.now();
        await triggerJobAndWait(
          "embed-inbox",
          {
            inboxId: inboxData.id,
            teamId,
          },
          "embeddings",
          { timeout: 60000 },
        );

        const embedDuration = Date.now() - embedStartTime;
        this.logger.info("Embed-inbox job completed", {
          inboxId: inboxData.id,
          teamId,
          duration: `${embedDuration}ms`,
        });

        await triggerJob(
          "batch-process-matching",
          {
            teamId,
            inboxIds: [inboxData.id],
          },
          "inbox",
        );

        this.logger.info("Triggered batch-process-matching", {
          inboxId: inboxData.id,
          teamId,
        });
      } catch (error) {
        this.logger.error("Failed to complete embedding/matching", {
          inboxId: inboxData.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        try {
          await updateInboxWithProcessedData(db, {
            id: inboxData.id,
            status: "pending",
          });
        } catch (updateError) {
          this.logger.error(
            "Failed to update inbox status after embed failure",
            {
              inboxId: inboxData.id,
              error:
                updateError instanceof Error
                  ? updateError.message
                  : "Unknown error",
            },
          );
        }
      }

      this.logger.info("WhatsApp upload processed successfully", {
        inboxId: inboxData.id,
        teamId,
        amount: updatedInbox?.amount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error("Failed to process WhatsApp upload", {
        inboxId: inboxData?.id ?? "not-created",
        error: errorMessage,
        mimeType,
      });

      // Update reaction to error
      await updateReaction(REACTION_EMOJIS.ERROR);

      // Re-throw timeout errors to trigger retry
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.warn("Document processing timed out, will retry", {
          inboxId: inboxData?.id ?? "not-created",
          errorType: error.name,
          errorMessage: error.message,
        });
        throw error;
      }

      // Update status to pending if inbox was created
      if (inboxData) {
        await updateInboxWithProcessedData(db, {
          id: inboxData.id,
          status: "pending",
        });
      }

      // Notify user of error
      try {
        await whatsappClient.sendMessage(
          phoneNumber,
          formatProcessingErrorMessage(),
        );
      } catch {
        // Ignore notification error
      }

      throw error;
    }
  }
}
