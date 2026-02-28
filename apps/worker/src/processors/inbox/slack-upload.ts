import { openai } from "@ai-sdk/openai";
import {
  createSlackWebClient,
  downloadFile,
  ensureBotInChannel,
} from "@midday/app-store/slack-client";
import {
  createInbox,
  groupRelatedInboxItems,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { triggerJob, triggerJobAndWait } from "@midday/job-client";
import { createClient } from "@midday/supabase/job";
import { getExtensionFromMimeType } from "@midday/utils";
import type { KnownBlock } from "@slack/types";
import { generateText } from "ai";
import type { Job } from "bullmq";
import { format, parseISO } from "date-fns";
import type { SlackUploadPayload } from "../../schemas/inbox";
import { classifyFromExtraction } from "../../utils/classify-from-extraction";
import { getDb } from "../../utils/db";
import { NonRetryableError } from "../../utils/error-classification";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

export class SlackUploadProcessor extends BaseProcessor<SlackUploadPayload> {
  async process(job: Job<SlackUploadPayload>): Promise<void> {
    const { teamId, token, channelId, threadId, messageTs, file } = job.data;

    this.logger.info("Starting Slack upload processing", {
      fileId: file.id,
      fileName: file.name,
      channelId,
    });
    const supabase = createClient();
    const db = getDb();

    const slackClient = createSlackWebClient({ token });

    // Get message timestamp for emoji reactions
    let messageTimestamp = messageTs || threadId;

    // Fallback: try to find message timestamp from channel history
    if (!messageTimestamp && file.id) {
      try {
        await ensureBotInChannel({ client: slackClient, channelId });
        const historyResult = await slackClient.conversations.history({
          channel: channelId,
          limit: 10,
        });
        const fileMessage = historyResult.messages?.find((msg) =>
          msg.files?.some((f) => f.id === file.id),
        );
        if (fileMessage?.ts) {
          messageTimestamp = fileMessage.ts;
        }
      } catch {
        // Ignore - will proceed without emoji reaction
      }
    }

    // Add processing emoji reaction
    let reactionAdded = false;
    if (messageTimestamp) {
      try {
        await ensureBotInChannel({ client: slackClient, channelId });
        await slackClient.reactions.add({
          channel: channelId,
          timestamp: String(messageTimestamp),
          name: "hourglass_flowing_sand",
        });
        reactionAdded = true;
      } catch (error) {
        this.logger.warn("Error adding emoji reaction", {
          error: error instanceof Error ? error.message : "Unknown error",
          channel: channelId,
          timestamp: messageTimestamp,
        });
      }
    } else {
      this.logger.debug("No message timestamp available for emoji reaction", {
        messageTs: messageTs || "missing",
        threadId: threadId || "missing",
      });
    }

    // Helper to remove the hourglass reaction
    const removeProcessingReaction = async () => {
      if (reactionAdded && messageTimestamp) {
        try {
          await slackClient.reactions.remove({
            channel: channelId,
            timestamp: messageTimestamp,
            name: "hourglass_flowing_sand",
          });
        } catch {
          // Ignore errors when removing reaction
        }
      }
    };

    // Wrap all processing in try-catch to ensure reaction cleanup on any error
    let inboxData: { id: string } | null | undefined = null;

    try {
      // Download file from Slack
      this.logger.info("Downloading file from Slack", {
        fileId: file.id,
        fileName: file.name,
      });

      const fileData = await downloadFile({
        privateDownloadUrl: file.url,
        token,
      });

      if (!fileData) {
        throw new NonRetryableError(
          "Failed to download file from Slack",
          undefined,
          "validation",
        );
      }

      if (fileData.byteLength === 0) {
        throw new NonRetryableError(
          "Downloaded file from Slack is empty",
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

      // Ensure file has proper extension based on mimetype
      const hasExtension = /\.[^.]+$/.test(file.name);
      const fileName = hasExtension
        ? file.name
        : `${file.name}${getExtensionFromMimeType(file.mimetype)}`;

      const filePath = [teamId, "inbox", fileName];
      const filePathStr = filePath.join("/");

      // Upload file to vault
      this.logger.info("Uploading file to vault", {
        filePath: filePathStr,
        fileSize: fileData.byteLength,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("vault")
        .upload(filePathStr, new Uint8Array(fileData), {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        this.logger.error("Failed to upload file to vault", {
          error: uploadError.message,
          filePath: filePathStr,
        });
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (!uploadData) {
        this.logger.error("Upload succeeded but no data returned", {
          filePath: filePathStr,
        });
        throw new Error("File upload succeeded but no data returned");
      }

      this.logger.info("File uploaded successfully", {
        filePath: filePathStr,
        uploadPath: uploadData.path,
      });

      // Create inbox entry with source metadata
      inboxData = await createInbox(db, {
        displayName: fileName,
        teamId,
        filePath,
        fileName,
        contentType: file.mimetype,
        size: file.size,
        referenceId: `slack_${file.id}_${fileName}`,
        meta: {
          source: "slack",
          sourceMetadata: {
            channelId,
            threadTs: threadId,
            messageTs: messageTs || messageTimestamp || undefined,
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

      if (signedUrlError) {
        this.logger.error("Failed to create signed URL", {
          error: signedUrlError.message,
          filePath: filePathStr,
          inboxId: inboxData.id,
        });
        throw new Error(
          `Failed to create signed URL: ${signedUrlError.message}`,
        );
      }

      if (!signedUrlData?.signedUrl) {
        this.logger.error("Signed URL data is missing", {
          filePath: filePathStr,
          inboxId: inboxData.id,
        });
        throw new Error("Failed to create signed URL for document processing");
      }

      const signedUrl = signedUrlData.signedUrl;

      // Validate signed URL is not empty
      if (
        !signedUrl ||
        typeof signedUrl !== "string" ||
        signedUrl.trim() === ""
      ) {
        this.logger.error("Signed URL is empty or invalid", {
          filePath: filePathStr,
          inboxId: inboxData.id,
        });
        throw new Error("Signed URL is empty or invalid");
      }

      const document = new DocumentClient();

      // Process document
      const result = await withTimeout(
        document.getInvoiceOrReceipt({
          documentUrl: signedUrl,
          mimetype: file.mimetype,
        }),
        TIMEOUTS.DOCUMENT_PROCESSING,
        `Document processing timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
      );

      // Check if document is classified as "other" (non-financial document)
      if (result.document_type === "other") {
        await updateInboxWithProcessedData(db, {
          id: inboxData.id,
          displayName: result.name ?? (fileName || "Untitled"),
          type: "other",
          status: "other",
        });

        this.logger.info(
          "Document classified as other (non-financial), skipping matching",
          {
            inboxId: inboxData.id,
            fileName: file.name,
          },
        );

        // Send message to Slack about non-financial document
        try {
          await ensureBotInChannel({ client: slackClient, channelId });
          await slackClient.chat.postMessage({
            channel: channelId,
            thread_ts: messageTimestamp,
            text: `This document doesn't appear to be an invoice or receipt. It has been saved to your inbox under "Other" documents.`,
          });
        } catch (error) {
          this.logger.warn("Failed to send Slack message for other document", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }

        // Replace hourglass with checkmark emoji for "other" documents
        await removeProcessingReaction();
        if (reactionAdded && messageTimestamp) {
          try {
            await slackClient.reactions.add({
              channel: channelId,
              timestamp: messageTimestamp,
              name: "white_check_mark",
            });
          } catch {
            // Ignore - reaction might already exist
          }
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
        status: "analyzing", // Keep analyzing until matching is complete
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
        // Don't fail the entire process if grouping fails
      }

      // Send extracted info back to Slack
      if (updatedInbox?.amount) {
        try {
          // Ensure bot is in channel before sending message (auto-joins public channels)
          await ensureBotInChannel({ client: slackClient, channelId });

          const documentTypeLabel =
            updatedInbox.type === "invoice" ? "invoice" : "receipt";

          // Format currency
          const formatCurrency = (amount: number | null | undefined) => {
            if (!amount || !updatedInbox.currency) return "N/A";
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: updatedInbox.currency,
            }).format(amount);
          };

          const invoiceNumber = updatedInbox.invoiceNumber ?? null;

          // Generate AI summary of the purchase
          let purchaseSummary: string | null = null;
          try {
            const summaryPrompt = `Based on this ${documentTypeLabel} from ${updatedInbox.displayName || "a vendor"}, write a brief, natural one-sentence summary describing what this purchase was likely for. 

Focus on what was purchased (e.g., "office supplies", "software subscription", "restaurant meal", "equipment") rather than repeating vendor name, date, or amount. Be specific and helpful for expense tracking. Keep it under 15 words.`;

            const summaryResult = await generateText({
              model: openai("gpt-4o-mini"),
              messages: [
                {
                  role: "user",
                  content: summaryPrompt,
                },
              ],
            });

            purchaseSummary = summaryResult.text.trim();
          } catch (error) {
            this.logger.debug("Failed to generate purchase summary", {
              error: error instanceof Error ? error.message : "Unknown error",
            });
            // Continue without summary if AI generation fails
          }

          // Build message blocks for better formatting
          const blocks: KnownBlock[] = [];

          // Summary block (if available) - make it prominent
          if (purchaseSummary) {
            blocks.push({
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${purchaseSummary}*`,
              },
            });
            blocks.push({ type: "divider" });
          }

          // Details block using fields for better layout
          const detailFields: Array<{ type: "mrkdwn"; text: string }> = [];

          detailFields.push({
            type: "mrkdwn",
            text: `*Vendor*\n${updatedInbox.displayName || "N/A"}`,
          });

          if (updatedInbox.date) {
            detailFields.push({
              type: "mrkdwn",
              text: `*Date*\n${format(parseISO(updatedInbox.date), "MMM d, yyyy")}`,
            });
          }

          if (invoiceNumber && updatedInbox.type === "invoice") {
            detailFields.push({
              type: "mrkdwn",
              text: `*Invoice #*\n${invoiceNumber}`,
            });
          }

          if (detailFields.length > 0) {
            blocks.push({
              type: "section",
              fields: detailFields,
            });
          }

          // Financial details block - use fields for side-by-side layout
          const financialFields: Array<{ type: "mrkdwn"; text: string }> = [];

          if (
            updatedInbox.taxAmount &&
            updatedInbox.taxAmount > 0 &&
            updatedInbox.amount
          ) {
            const subtotal = updatedInbox.amount - updatedInbox.taxAmount;
            const taxTypeLabel = updatedInbox.taxType?.toUpperCase() || "TAX";
            const taxRateText = updatedInbox.taxRate
              ? ` (${updatedInbox.taxRate}%)`
              : "";

            financialFields.push({
              type: "mrkdwn",
              text: `*Subtotal*\n${formatCurrency(subtotal)}`,
            });
            financialFields.push({
              type: "mrkdwn",
              text: `*${taxTypeLabel}${taxRateText}*\n${formatCurrency(updatedInbox.taxAmount)}`,
            });
          }

          financialFields.push({
            type: "mrkdwn",
            text: `*Total*\n${formatCurrency(updatedInbox.amount)}`,
          });

          blocks.push({
            type: "section",
            fields: financialFields,
          });

          // Action button
          blocks.push({
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View in Midday",
                  emoji: true,
                },
                url: `https://app.midday.ai/inbox?inboxId=${encodeURIComponent(updatedInbox.id)}`,
                action_id: "view_receipt",
              },
            ],
          });

          await slackClient.chat.postMessage({
            channel: channelId,
            thread_ts: messageTimestamp,
            text: `${updatedInbox.displayName}: ${formatCurrency(updatedInbox.amount)}`,
            unfurl_links: false,
            unfurl_media: false,
            blocks,
          });
        } catch (slackError) {
          this.logger.warn("Failed to send Slack message", {
            error:
              slackError instanceof Error
                ? slackError.message
                : "Unknown error",
          });
        }
      }

      // Replace hourglass with checkmark emoji (regardless of whether message was sent)
      await removeProcessingReaction();
      if (reactionAdded && messageTimestamp) {
        try {
          await slackClient.reactions.add({
            channel: channelId,
            timestamp: messageTimestamp,
            name: "white_check_mark",
          });
        } catch {
          // Ignore - reaction might already exist
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

      this.logger.info("Slack upload processed successfully", {
        inboxId: inboxData.id,
        teamId,
        amount: updatedInbox?.amount,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error("Failed to process Slack upload", {
        inboxId: inboxData?.id ?? "not-created",
        error: errorMessage,
        mimetype: file.mimetype,
        fileName: file.name,
      });

      // Always remove processing reaction on any error
      await removeProcessingReaction();

      // Re-throw timeout errors to trigger retry
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.warn("Document processing timed out, will retry", {
          inboxId: inboxData?.id ?? "not-created",
          errorType: error.name,
          errorMessage: error.message,
        });
        throw error;
      }

      // Update status to pending even if processing failed (only if inbox was created)
      if (inboxData) {
        await updateInboxWithProcessedData(db, {
          id: inboxData.id,
          status: "pending",
        });
      }

      throw error;
    }
  }
}
