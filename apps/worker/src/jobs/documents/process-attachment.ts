import { createInbox, updateInbox } from "@midday/db/queries";
import { DocumentClient } from "@midday/documents";
import { createClient } from "@midday/supabase/job";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { z } from "zod";
import { convertHeicJob } from "./convert-heic";

export const processAttachmentJob = job(
  "process-attachment",
  z.object({
    teamId: z.string().uuid(),
    mimetype: z.string(),
    size: z.number(),
    filePath: z.array(z.string()),
    referenceId: z.string().optional(),
    website: z.string().optional(),
  }),
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 1,
    removeOnComplete: 100, // Keep more attachment processing logs
  },
  async ({ teamId, mimetype, size, filePath, referenceId, website }, ctx) => {
    ctx.logger.info("Processing attachment", {
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

    const filename = filePath.at(-1);

    if (!filename) {
      throw new Error("Filename not found");
    }

    const inboxData = await createInbox(ctx.db, {
      teamId,
      // NOTE: If we can't parse the name using OCR this will be the fallback name
      displayName: filename,
      filePath,
      fileName: filename,
      contentType: mimetype,
      size,
      referenceId,
      website,
    });

    if (!inboxData) {
      throw new Error("Inbox data not found");
    }

    ctx.logger.info("Created inbox record", { inboxId: inboxData.id });

    const { data } = await supabase.storage
      .from("vault")
      .createSignedUrl(filePath.join("/"), 60);

    if (!data) {
      throw new Error("File not found");
    }

    try {
      const document = new DocumentClient();

      ctx.logger.info("Processing document with AI", { inboxId: inboxData.id });

      const result = await document.getInvoiceOrReceipt({
        documentUrl: data?.signedUrl,
        mimetype,
      });

      await updateInbox(ctx.db, {
        id: inboxData.id,
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

      ctx.logger.info("Updated inbox with parsed data", {
        inboxId: inboxData.id,
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
        inboxId: inboxData.id,
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
      // If we end up here we could not parse the document
      // But we want to update the status so we show the record with fallback name
      ctx.logger.warn("Could not parse document", {
        inboxId: inboxData.id,
        error: error instanceof Error ? error.message : error,
      });

      await updateInbox(ctx.db, {
        id: inboxData.id,
        teamId,
        status: "pending",
      });

      return {
        inboxId: inboxData.id,
        teamId,
        processed: true,
        documentParsed: false,
        fallbackUsed: true,
      };
    }
  },
);
