import {
  checkInboxEmbeddingExists,
  createInboxEmbedding,
  getInboxForEmbedding,
} from "@midday/db/queries";
import { inbox } from "@midday/db/schema";
import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import type { EmbedInboxPayload } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { generateEmbedding } from "../../utils/embeddings";
import { prepareInboxText } from "../../utils/text-preparation";
import { BaseProcessor } from "../base";

export class EmbedInboxProcessor extends BaseProcessor<EmbedInboxPayload> {
  async process(job: Job<EmbedInboxPayload>): Promise<void> {
    const { inboxId, teamId } = job.data;
    const db = getDb();

    await this.updateProgress(job, 10);

    // Set status to analyzing when we start processing
    await db
      .update(inbox)
      .set({ status: "analyzing" })
      .where(eq(inbox.id, inboxId));

    this.logger.info({ inboxId, teamId }, "Starting inbox analysis");

    await this.updateProgress(job, 20);

    // Check if embedding already exists
    const embeddingExists = await checkInboxEmbeddingExists(db, { inboxId });

    if (embeddingExists) {
      this.logger.info(
        { inboxId, teamId },
        "Inbox embedding already exists, skipping creation",
      );
      await this.updateProgress(job, 100);
      return;
    }

    await this.updateProgress(job, 30);

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
    if (!inboxItem) {
      await db
        .update(inbox)
        .set({ status: "pending" })
        .where(eq(inbox.id, inboxId));
      throw new Error(`Inbox item not found: ${inboxId}`);
    }

    await this.updateProgress(job, 40);

    const text = prepareInboxText({
      displayName: inboxItem.displayName ?? null,
      website: inboxItem.website ?? null,
    });

    if (!text.trim()) {
      this.logger.warn(
        {
          inboxId,
          teamId,
          displayName: inboxItem.displayName,
        },
        "No text to embed for inbox item",
      );

      // Set back to pending if no text to process
      await db
        .update(inbox)
        .set({ status: "pending" })
        .where(eq(inbox.id, inboxId));
      await this.updateProgress(job, 100);
      return;
    }

    await this.updateProgress(job, 50);

    try {
      this.logger.info(
        {
          inboxId,
          teamId,
          textLength: text.length,
        },
        "Generating embedding for inbox item",
      );

      const { embedding, model } = await generateEmbedding(text);

      await this.updateProgress(job, 80);

      await createInboxEmbedding(db, {
        inboxId,
        teamId,
        embedding,
        sourceText: text,
        model,
      });

      await this.updateProgress(job, 100);

      this.logger.info(
        {
          inboxId,
          teamId,
          embeddingDimensions: embedding.length,
        },
        "Inbox embedding created successfully",
      );
    } catch (error) {
      this.logger.error(
        {
          inboxId,
          teamId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to create inbox embedding",
      );

      // Set back to pending on error
      await db
        .update(inbox)
        .set({ status: "pending" })
        .where(eq(inbox.id, inboxId));

      throw error;
    }
  }
}
