import { getDb } from "@jobs/init";
import { generateEmbedding } from "@jobs/utils/embeddings";
import { prepareInboxText } from "@jobs/utils/text-preparation";
import {
  checkInboxEmbeddingExists,
  createInboxEmbedding,
  getInboxForEmbedding,
} from "@midday/db/queries";
import { inbox } from "@midday/db/schema";
import { logger, schemaTask, tasks } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const embedInbox = schemaTask({
  id: "embed-inbox",
  schema: z.object({
    inboxId: z.string().uuid(),
    teamId: z.string().uuid(),
  }),
  machine: "micro",
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async ({ inboxId, teamId }) => {
    const db = getDb();

    // Set status to analyzing when we start processing
    await db
      .update(inbox)
      .set({ status: "analyzing" })
      .where(eq(inbox.id, inboxId));

    logger.info("Starting inbox analysis", { inboxId, teamId });

    // Check if embedding already exists
    const embeddingExists = await checkInboxEmbeddingExists(db, { inboxId });

    if (embeddingExists) {
      logger.info(
        "Inbox embedding already exists, skipping to match calculation",
        {
          inboxId,
          teamId,
        },
      );

      // Skip to match calculation if embedding exists
      await tasks.trigger("calculate-suggestions", {
        teamId,
        inboxId,
      });
      return;
    }

    // Get inbox data
    const inboxData = await getInboxForEmbedding(db, { inboxId });

    if (inboxData.length === 0) {
      // Set back to pending if we can't process
      await db
        .update(inbox)
        .set({ status: "pending" })
        .where(eq(inbox.id, inboxId));
      throw new Error(`Inbox not found: ${inboxId}`);
    }

    const inboxItem = inboxData[0];
    const text = prepareInboxText(inboxItem);

    if (!text.trim()) {
      logger.warn("No text to embed for inbox item", {
        inboxId,
        teamId,
        displayName: inboxItem.displayName,
      });

      // Set back to pending if no text to process
      await db
        .update(inbox)
        .set({ status: "pending" })
        .where(eq(inbox.id, inboxId));
      return;
    }

    try {
      logger.info("Generating embedding for inbox item", {
        inboxId,
        teamId,
        textLength: text.length,
      });

      const { embedding, model } = await generateEmbedding(text);

      await createInboxEmbedding(db, {
        inboxId,
        teamId,
        embedding,
        sourceText: text,
        model,
      });

      logger.info("Inbox embedding created successfully", {
        inboxId,
        teamId,
        embeddingDimensions: embedding.length,
      });

      // After embedding is created, calculate suggestions
      await tasks.trigger("calculate-suggestions", {
        teamId,
        inboxId,
      });
    } catch (error) {
      logger.error("Failed to create inbox embedding", {
        inboxId,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Set back to pending on error
      await db
        .update(inbox)
        .set({ status: "pending" })
        .where(eq(inbox.id, inboxId));

      throw error;
    }
  },
});
