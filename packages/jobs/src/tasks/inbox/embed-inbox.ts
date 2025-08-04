import { getDb } from "@jobs/init";
import { generateEmbedding } from "@jobs/utils/embeddings";
import { prepareInboxText } from "@jobs/utils/text-preparation";
import {
  checkInboxEmbeddingExists,
  createInboxEmbedding,
  getInboxForEmbedding,
} from "@midday/db/queries";
import { logger, schemaTask } from "@trigger.dev/sdk";
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

    // Check if embedding already exists
    const embeddingExists = await checkInboxEmbeddingExists(db, { inboxId });

    if (embeddingExists) {
      logger.info("Inbox embedding already exists", { inboxId, teamId });
      return;
    }

    // Get inbox data
    const inboxData = await getInboxForEmbedding(db, { inboxId });

    if (inboxData.length === 0) {
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
      return;
    }

    try {
      logger.info("Starting inbox embedding", {
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

      logger.info("Inbox embedding created", {
        inboxId,
        teamId,
        embeddingDimensions: embedding.length,
      });
    } catch (error) {
      logger.error("Inbox embedding failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        inboxId,
        teamId,
      });
      throw error;
    }
  },
});
