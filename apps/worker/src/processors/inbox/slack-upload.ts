import {
  createSlackWebClient,
  downloadFile,
} from "@midday/app-store/slack-client";
import {
  getInboxByFilePath,
  updateInboxWithProcessedData,
} from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { getExtensionFromMimeType } from "@midday/utils";
import type { Job } from "bullmq";
import { format } from "date-fns";
import type { SlackUploadPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

export class SlackUploadProcessor extends BaseProcessor<SlackUploadPayload> {
  async process(job: Job<SlackUploadPayload>): Promise<void> {
    const { teamId, filePath, mimetype, size } = job.data;
    const supabase = createClient();
    const db = getDb();

    await this.updateProgress(job, 10);

    // Note: Slack-specific fields (token, channelId, threadId, file.url) would need to be
    // passed differently or stored temporarily. For now, we'll process the uploaded file.
    // The file should already be uploaded to vault by the time this job runs.

    const filename = filePath.at(-1);
    if (!filename) {
      throw new Error("Filename not found in file path");
    }

    await this.updateProgress(job, 20);

    // Get inbox item that was created
    const inboxData = await getInboxByFilePath(db, {
      filePath,
      teamId,
    });

    if (!inboxData) {
      throw new Error("Inbox data not found");
    }

    await this.updateProgress(job, 40);

    try {
      const document = new DocumentClient();

      // Download file from vault for processing
      const { data: fileData } = await supabase.storage
        .from("vault")
        .download(filePath.join("/"));

      if (!fileData) {
        throw new Error("File not found in vault");
      }

      const buffer = await fileData.arrayBuffer();
      const base64Content = Buffer.from(buffer).toString("base64");

      await this.updateProgress(job, 60);

      const result = await document.getInvoiceOrReceipt({
        content: base64Content,
        mimetype,
      });

      await this.updateProgress(job, 80);

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

      await this.updateProgress(job, 90);

      // Note: Slack notification would need to be handled separately
      // as we don't have access to token/channelId/threadId in this processor
      // This could be passed via job data or stored in a separate table

      if (updatedInbox?.amount) {
        // Trigger notification job (via Trigger.dev for now)
        // TODO: Port notification system to BullMQ or create notification processor
        this.logger.info(
          {
            inboxId: updatedInbox.id,
            teamId,
            amount: updatedInbox.amount,
          },
          "Slack upload processed successfully",
        );
      }

      await this.updateProgress(job, 100);
    } catch (error) {
      this.logger.error(
        {
          inboxId: inboxData.id,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to process Slack upload",
      );

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
