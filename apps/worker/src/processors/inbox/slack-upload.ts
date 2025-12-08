import {
  createSlackWebClient,
  downloadFile,
} from "@midday/app-store/slack-client";
import {
  getInboxByFilePath,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { Notifications } from "@midday/notifications";
import { createClient } from "@midday/supabase/job";
import { getExtensionFromMimeType } from "@midday/utils";
import type { Job } from "bullmq";
import { format } from "date-fns";
import type { SlackUploadPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

export class SlackUploadProcessor extends BaseProcessor<SlackUploadPayload> {
  async process(job: Job<SlackUploadPayload>): Promise<void> {
    const { teamId, filePath, mimetype, size } = job.data;
    const supabase = createClient();
    const db = getDb();

    // Note: Slack-specific fields (token, channelId, threadId, file.url) would need to be
    // passed differently or stored temporarily. For now, we'll process the uploaded file.
    // The file should already be uploaded to vault by the time this job runs.

    const filename = filePath.at(-1);
    if (!filename) {
      throw new Error("Filename not found in file path");
    }

    // Get inbox item that was created
    const inboxData = await getInboxByFilePath(db, {
      filePath,
      teamId,
    });

    if (!inboxData) {
      throw new Error("Inbox data not found");
    }

    try {
      const document = new DocumentClient();

      // Download file from vault for processing with timeout
      const { data: fileData } = await withTimeout(
        supabase.storage.from("vault").download(filePath.join("/")),
        TIMEOUTS.FILE_DOWNLOAD,
        `File download timed out after ${TIMEOUTS.FILE_DOWNLOAD}ms`,
      );

      if (!fileData) {
        throw new Error("File not found in vault");
      }

      const buffer = await fileData.arrayBuffer();
      const base64Content = Buffer.from(buffer).toString("base64");

      const result = await withTimeout(
        document.getInvoiceOrReceipt({
          content: base64Content,
          mimetype,
        }),
        TIMEOUTS.DOCUMENT_PROCESSING,
        `Document processing timed out after ${TIMEOUTS.DOCUMENT_PROCESSING}ms`,
      );

      const updatedInbox = await updateInboxWithProcessedData(db, {
        id: inboxData.id,
        amount: result.amount ?? undefined,
        currency: result.currency ?? undefined,
        displayName: result.name ?? undefined,
        website: result.website ?? undefined,
        date: result.date ?? undefined,
        type: result.type as "invoice" | "expense" | null | undefined,
        status: "pending",
      });

      // Note: Slack message posting would need to be handled separately
      // as we don't have access to token/channelId/threadId in this processor
      // This could be passed via job data or stored in a separate table

      if (updatedInbox?.amount) {
        // Send notification for Slack upload
        // try {
        //   const notifications = new Notifications(db);
        //   await notifications.create("inbox_new", teamId, {
        //     totalCount: 1,
        //     inboxType: "slack",
        //   });
        // } catch (error) {
        //   // Don't fail the entire process if notification fails
        //   this.logger.warn(
        //     {
        //       inboxId: updatedInbox.id,
        //       teamId,
        //       error: error instanceof Error ? error.message : "Unknown error",
        //     },
        //     "Failed to create inbox_new notification",
        //   );
        // }

        this.logger.info("Slack upload processed successfully", {
          inboxId: updatedInbox.id,
          teamId,
          amount: updatedInbox.amount,
        });
      }
    } catch (error) {
      this.logger.error("Failed to process Slack upload", {
        inboxId: inboxData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // If we end up here we could not parse the document
      // But we want to update the status so we show the record with fallback name
      await updateInboxWithProcessedData(db, {
        id: inboxData.id,
        status: "pending",
      });

      throw error;
    }
  }
}
