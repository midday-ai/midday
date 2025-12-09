import {
  checkInboxEmbeddingExists,
  createInboxEmbedding,
  getInboxForEmbedding,
  updateInboxStatus,
} from "@midday/db/queries";
import type { Job } from "bullmq";
import { type EmbedInboxPayload, embedInboxSchema } from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { generateEmbedding } from "../../utils/embeddings";
import { prepareInboxText } from "../../utils/text-preparation";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

export class EmbedInboxProcessor extends BaseProcessor<EmbedInboxPayload> {
  protected getPayloadSchema() {
    return embedInboxSchema;
  }

  protected async shouldProcess(job: Job<EmbedInboxPayload>): Promise<boolean> {
    const { inboxId, teamId } = job.data;
    const db = getDb();

    // Idempotency check: Check if embedding already exists
    const embeddingExists = await checkInboxEmbeddingExists(db, { inboxId });

    if (embeddingExists) {
      this.logger.info(
        "Inbox embedding already exists, skipping (idempotency check)",
        { inboxId, teamId, jobId: job.id },
      );
      // If embedding already exists, ensure status is not stuck in "analyzing"
      // Set to pending so batch-process-matching can process it
      await updateInboxStatus(db, { id: inboxId, status: "pending" });
      return false;
    }

    return true;
  }

  async process(job: Job<EmbedInboxPayload>): Promise<void> {
    const processStartTime = Date.now();
    const { inboxId, teamId } = job.data;
    const db = getDb();

    this.logger.info("Starting embed-inbox job", {
      jobId: job.id,
      inboxId,
      teamId,
    });

    // Set status to analyzing when we start processing
    await updateInboxStatus(db, { id: inboxId, status: "analyzing" });

    // Get inbox data
    const inboxData = await getInboxForEmbedding(db, { inboxId });

    if (inboxData.length === 0) {
      // Set back to pending if we can't process
      await updateInboxStatus(db, { id: inboxId, status: "pending" });
      throw new Error(`Inbox not found: ${inboxId}`);
    }

    const inboxItem = inboxData[0];
    if (!inboxItem) {
      await updateInboxStatus(db, { id: inboxId, status: "pending" });
      throw new Error(`Inbox item not found: ${inboxId}`);
    }

    // Edge case: Handle empty or null data
    if (!inboxItem.displayName && !inboxItem.website) {
      this.logger.warn(
        "Inbox item has no displayName or website, cannot generate embedding",
        {
          inboxId,
          teamId,
        },
      );

      // Set back to pending if no data to process
      await updateInboxStatus(db, { id: inboxId, status: "pending" });
      return;
    }

    const text = prepareInboxText({
      displayName: inboxItem.displayName ?? null,
      website: inboxItem.website ?? null,
    });

    // Edge case: Empty text after preparation
    if (!text || !text.trim()) {
      this.logger.warn("No text to embed for inbox item after preparation", {
        inboxId,
        teamId,
        displayName: inboxItem.displayName,
        website: inboxItem.website,
      });

      // Set back to pending if no text to process
      await updateInboxStatus(db, { id: inboxId, status: "pending" });
      return;
    }

    try {
      const embeddingStartTime = Date.now();
      this.logger.info("Generating embedding for inbox item", {
        jobId: job.id,
        inboxId,
        teamId,
        textLength: text.length,
      });

      // Generate embedding with timeout
      const { embedding, model } = await withTimeout(
        generateEmbedding(text),
        TIMEOUTS.EMBEDDING,
        `Embedding generation timed out after ${TIMEOUTS.EMBEDDING}ms`,
      );

      const embeddingDuration = Date.now() - embeddingStartTime;
      this.logger.info("Embedding generated successfully", {
        jobId: job.id,
        inboxId,
        teamId,
        embeddingDimensions: embedding.length,
        model,
        duration: `${embeddingDuration}ms`,
      });

      const saveStartTime = Date.now();
      await createInboxEmbedding(db, {
        inboxId,
        teamId,
        embedding,
        sourceText: text,
        model,
      });

      const saveDuration = Date.now() - saveStartTime;
      const totalDuration = Date.now() - processStartTime;

      this.logger.info("Inbox embedding created successfully", {
        jobId: job.id,
        inboxId,
        teamId,
        embeddingDimensions: embedding.length,
        saveDuration: `${saveDuration}ms`,
        totalDuration: `${totalDuration}ms`,
      });

      // After embedding is created, set status to pending so batch-process-matching can process it
      // Don't leave it as "analyzing" - let the matching job handle status updates
      await updateInboxStatus(db, { id: inboxId, status: "pending" });
    } catch (error) {
      this.logger.error("Failed to create inbox embedding", {
        inboxId,
        teamId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Set back to pending on error
      await updateInboxStatus(db, { id: inboxId, status: "pending" });

      throw error;
    }
  }
}
