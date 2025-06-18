import { updateInbox } from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { z } from "zod";
import { convertHeicJob } from "./convert-heic";

export const processInboxJob = job(
  "process-inbox",
  z.object({
    inboxId: z.string().uuid(),
    teamId: z.string().uuid(),
    mimetype: z.string(),
    filePath: z.array(z.string()),
  }),
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 1,
    removeOnComplete: 100, // Keep more attachment processing logs
  },
  async ({ inboxId, teamId, mimetype, filePath }, ctx) => {
    ctx.logger.info("Processing inbox", {
      inboxId,
      teamId,
      mimetype,
      filePath: filePath.join("/"),
    });

    const supabase = createClient();

    // If the file is a HEIC we need to convert it to a JPG
    if (mimetype === "image/heic") {
      ctx.logger.info("Converting HEIC file", { filePath });
      await convertHeicJob.trigger({
        filePath,
      });
    }

    ctx.logger.info("Processing document with AI", { inboxId });

    const { data } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!data) {
      throw new Error("File not found");
    }

    try {
      const document = new DocumentClient();

      // Add progress tracking for long-running AI processing
      await ctx.job.updateProgress(25);
      ctx.logger.info("Starting AI document parsing", { inboxId });

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        mimetype,
      });

      await ctx.job.updateProgress(75);
      ctx.logger.info("AI parsing completed, updating database", { inboxId });

      await updateInbox(ctx.db, {
        id: inboxId,
        teamId,
        amount: result.amount,
        currency: result.currency,
        displayName: result.name ?? undefined,
        website: result.website ?? undefined,
        date: result.date,
        taxAmount: result.tax_amount,
        taxRate: result.tax_rate,
        taxType: result.tax_type,
        type: result.type as "invoice" | "expense" | null | undefined,
        status: "pending",
      });

      await ctx.job.updateProgress(100);

      ctx.logger.info("Updated inbox with parsed data", {
        inboxId,
        amount: result.amount,
        currency: result.currency,
        type: result.type,
      });

      // NOTE: Process documents and images for classification
      // TODO: Implement processDocument job if needed
      // await processDocumentJob.trigger({
      //   mimetype,
      //   filePath,
      //   teamId,
      // });

      // TODO: Send event to match inbox

      return {
        inboxId,
        teamId,
        processed: true,
        documentParsed: true,
        result: {
          amount: result.amount,
          currency: result.currency,
          type: result.type,
          name: result.name,
        },
      };
    } catch (error) {
      // Enhanced error logging for better debugging
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isTimeoutError =
        errorMessage.toLowerCase().includes("timeout") ||
        errorMessage.toLowerCase().includes("aborted") ||
        errorMessage.toLowerCase().includes("timed out");

      ctx.logger.warn("Could not parse document", {
        inboxId,
        error: errorMessage,
        isTimeoutError,
        errorType: error?.constructor?.name,
      });

      // If it's a timeout error, log additional context
      if (isTimeoutError) {
        ctx.logger.warn("AI processing timeout detected", {
          inboxId,
          mimetype,
          filePath: filePath.join("/"),
          suggestion: "Consider reducing document complexity or file size",
        });
      }

      await updateInbox(ctx.db, {
        id: inboxId,
        teamId,
        status: "pending",
      });

      return {
        inboxId,
        teamId,
        processed: true,
        documentParsed: false,
        fallbackUsed: true,
        error: isTimeoutError ? "AI_TIMEOUT" : "PARSING_ERROR",
      };
    }
  },
);
