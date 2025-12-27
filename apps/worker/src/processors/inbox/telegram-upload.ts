import {
  TELEGRAM_EMOJIS,
  createTelegramClient,
  formatDocumentProcessedSuccess,
  formatExtractionFailedMessage,
  formatProcessingErrorMessage,
} from "@midday/app-store/telegram/server";
import {
  createInbox,
  groupRelatedInboxItems,
  updateInbox,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import { getExtensionFromMimeType } from "@midday/utils";
import type { Job } from "bullmq";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import type { TelegramUploadPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

export class TelegramUploadProcessor extends BaseProcessor<TelegramUploadPayload> {
  async process(job: Job<TelegramUploadPayload>): Promise<void> {
    const { teamId, chatId, messageId, fileId, mimeType, filename, caption } =
      job.data;

    this.logger.info("Starting Telegram upload processing", {
      teamId,
      chatId,
      messageId,
      fileId,
      mimeType,
    });

    const supabase = createClient();
    const db = getDb();
    const telegramClient = createTelegramClient();

    // Helper to send status message
    const sendStatusMessage = async (text: string) => {
      try {
        await telegramClient.sendMessage(chatId, text, {
          parse_mode: "Markdown",
        });
      } catch (error) {
        this.logger.warn("Failed to send Telegram message", {
          chatId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    let inboxData: { id: string } | null | undefined = null;

    try {
      // Download file from Telegram
      this.logger.info("Downloading file from Telegram", {
        fileId,
        mimeType,
      });

      const { buffer: fileData, filePath: telegramFilePath } =
        await telegramClient.getFileAndDownload(fileId);

      if (!fileData || fileData.byteLength === 0) {
        throw new Error(
          "Failed to download file from Telegram or file is empty",
        );
      }

      // Validate file size (max 20MB)
      const MAX_FILE_SIZE = 20 * 1024 * 1024;
      if (fileData.byteLength > MAX_FILE_SIZE) {
        throw new Error(
          `File size (${(fileData.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (20MB)`,
        );
      }

      // Generate filename if not provided
      const originalFileName =
        filename || telegramFilePath.split("/").pop() || `telegram_${nanoid(8)}`;
      const hasExtension = /\.[^.]+$/.test(originalFileName);
      const finalFileName = hasExtension
        ? originalFileName
        : `${originalFileName}${getExtensionFromMimeType(mimeType)}`;

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
        referenceId: `telegram_${fileId}_${finalFileName}`,
        meta: {
          source: "telegram",
          sourceMetadata: {
            chatId,
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

      // Get signed URL for document processing
      const pathForSignedUrl = uploadData.path || filePathStr;
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("vault")
          .createSignedUrl(pathForSignedUrl, 1800);

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
        type: result.type as "invoice" | "expense" | null | undefined,
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

      // Send extracted info back to Telegram
      if (updatedInbox?.amount) {
        try {
          const formatCurrency = (amount: number | null | undefined) => {
            if (!amount || !updatedInbox.currency) return undefined;
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: updatedInbox.currency,
            }).format(amount);
          };

          const documentType =
            updatedInbox.type === "invoice" ? "Invoice" : "Receipt";

          const formattedDate = updatedInbox.date
            ? format(new Date(updatedInbox.date), "MMM d, yyyy")
            : undefined;

          const formattedAmount = formatCurrency(updatedInbox.amount);
          const formattedTaxAmount = updatedInbox.taxAmount
            ? formatCurrency(updatedInbox.taxAmount)
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
              updatedInbox.type === "invoice" &&
              "invoiceNumber" in updatedInbox &&
              updatedInbox.invoiceNumber
                ? updatedInbox.invoiceNumber
                : undefined,
            taxAmount: taxAmountValue,
            taxType: updatedInbox.taxType || undefined,
          });

          if (successMessage.buttons && successMessage.buttons.length > 0) {
            await telegramClient.sendMessageWithButtons(
              chatId,
              successMessage.text,
              successMessage.buttons.map((btn) => ({
                text: btn.text,
                callbackData: btn.callbackData,
              })),
              { parse_mode: "Markdown" },
            );
          } else {
            await telegramClient.sendMessage(chatId, successMessage.text, {
              parse_mode: "Markdown",
            });
          }
        } catch (error) {
          this.logger.warn("Failed to send Telegram message", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Trigger document classification
      await triggerJob(
        "process-document",
        {
          mimetype: mimeType,
          filePath,
          teamId,
        },
        "documents",
      );

      // Trigger embedding and wait for completion
      this.logger.info("Triggering embed-inbox job", {
        inboxId: inboxData.id,
        teamId,
      });

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

      // Trigger matching
      await triggerJob(
        "batch-process-matching",
        {
          teamId,
          inboxIds: [inboxData.id],
        },
        "inbox",
      );

      this.logger.info("Telegram upload processed successfully", {
        inboxId: inboxData.id,
        teamId,
        amount: updatedInbox?.amount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const isGeminiImageError =
        errorMessage.includes("Unable to process input image") ||
        errorMessage.includes("INVALID_ARGUMENT");

      this.logger.error("Failed to process Telegram upload", {
        inboxId: inboxData?.id ?? "not-created",
        error: errorMessage,
        isGeminiImageError,
        mimeType,
      });

      // For Gemini image processing errors, mark as pending for manual review
      if (isGeminiImageError && inboxData) {
        this.logger.info(
          "Gemini failed to process image, marking as pending for manual review",
          {
            inboxId: inboxData.id,
            mimeType,
            error: errorMessage,
          },
        );

        try {
          await updateInbox(db, {
            id: inboxData.id,
            teamId,
            status: "pending",
          });

          const failedMessage = formatExtractionFailedMessage();
          if (failedMessage.buttons && failedMessage.buttons.length > 0) {
            await telegramClient.sendMessageWithButtons(
              chatId,
              failedMessage.text,
              failedMessage.buttons.map((btn) => ({
                text: btn.text,
                callbackData: btn.callbackData,
              })),
              { parse_mode: "Markdown" },
            );
          } else {
            await telegramClient.sendMessage(chatId, failedMessage.text, {
              parse_mode: "Markdown",
            });
          }
        } catch (updateError) {
          this.logger.error("Failed to update inbox status to pending", {
            inboxId: inboxData.id,
            error:
              updateError instanceof Error
                ? updateError.message
                : "Unknown error",
          });
        }

        return;
      }

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
      await sendStatusMessage(formatProcessingErrorMessage());

      throw error;
    }
  }
}

