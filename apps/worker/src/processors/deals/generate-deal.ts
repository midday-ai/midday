import { getDealById, updateDeal } from "@midday/db/queries";
import { PdfTemplate, renderToBuffer } from "@midday/deal";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import { DEFAULT_JOB_OPTIONS } from "../../config/job-options";
import { documentsQueue } from "../../queues/documents";
import { dealsQueue } from "../../queues/deals";
import type { GenerateDealPayload } from "../../schemas/deals";
import { getDb } from "../../utils/db";
import { BaseProcessor } from "../base";

/**
 * Generate Deal Processor
 * Handles PDF generation and storage upload for deals
 * Optionally triggers email sending via send-deal-email job
 */
export class GenerateDealProcessor extends BaseProcessor<GenerateDealPayload> {
  async process(job: Job<GenerateDealPayload>): Promise<void> {
    const { dealId, deliveryType } = job.data;
    const db = getDb();
    // Supabase client is needed for storage operations only
    const supabase = createClient();

    this.logger.info("Starting deal generation", {
      jobId: job.id,
      dealId,
      deliveryType,
    });

    // Fetch deal data
    const dealData = await getDealById(db, { id: dealId });

    if (!dealData) {
      this.logger.error("Failed to fetch deal", { dealId });
      throw new Error(`Deal not found: ${dealId}`);
    }

    const { user, ...deal } = dealData;

    this.logger.debug("Generating PDF", { dealId });

    // Generate PDF buffer
    // @ts-ignore - Template JSONB type differs from EditorDoc in components
    const buffer = await renderToBuffer(await PdfTemplate(deal));

    const filename = `${dealData.dealNumber}.pdf`;
    const fullPath = `${dealData.teamId}/deals/${filename}`;

    this.logger.debug("Uploading PDF to storage", {
      dealId,
      fullPath,
      fileSize: buffer.length,
    });

    // Upload to Supabase storage (storage SDK is still needed)
    const { error: uploadError } = await supabase.storage
      .from("vault")
      .upload(fullPath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      this.logger.error("Failed to upload PDF", {
        dealId,
        error: uploadError.message,
      });
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    this.logger.debug("PDF uploaded to storage", { dealId, fullPath });

    // Update deal with file path and size using Drizzle
    const updated = await updateDeal(db, {
      id: dealId,
      teamId: dealData.teamId,
      filePath: [dealData.teamId, "deals", filename],
      fileSize: buffer.length,
    });

    if (!updated) {
      this.logger.error("Failed to update deal with file info", {
        dealId,
      });
      throw new Error("Failed to update deal with file info");
    }

    // Queue email sending if delivery type is create_and_send
    if (deliveryType === "create_and_send") {
      await dealsQueue.add(
        "send-deal-email",
        {
          dealId,
          filename,
          fullPath,
        },
        DEFAULT_JOB_OPTIONS,
      );

      this.logger.debug("Queued send-deal-email job", { dealId });
    }

    // Queue document processing for classification
    await documentsQueue.add(
      "process-document",
      {
        filePath: [dealData.teamId, "deals", filename],
        mimetype: "application/pdf",
        teamId: dealData.teamId,
      },
      DEFAULT_JOB_OPTIONS,
    );

    this.logger.info("Deal generation completed", {
      dealId,
      filename,
      fullPath,
      deliveryType,
    });
  }
}
