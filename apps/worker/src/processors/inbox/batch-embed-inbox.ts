import {
  createInboxEmbeddings,
  getInboxItemsForEmbedding,
  updateInboxStatus,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import type { Job } from "bullmq";
import {
  type BatchEmbedInboxPayload,
  batchEmbedInboxSchema,
} from "../../schemas/inbox";
import { getDb } from "../../utils/db";
import { generateEmbeddings } from "../../utils/embeddings";
import { processBatch } from "../../utils/process-batch";
import { prepareInboxText } from "../../utils/text-preparation";
import { BaseProcessor } from "../base";

const EMBED_BATCH_SIZE = 50;

export class BatchEmbedInboxProcessor extends BaseProcessor<BatchEmbedInboxPayload> {
  protected getPayloadSchema() {
    return batchEmbedInboxSchema;
  }

  async process(job: Job<BatchEmbedInboxPayload>): Promise<{
    totalItems: number;
    embedded: number;
    skipped: number;
  }> {
    const { items, teamId } = job.data;
    const db = getDb();

    this.logger.info("Starting batch embed-inbox", {
      jobId: job.id,
      teamId,
      itemCount: items.length,
    });

    const inboxIds = items.map((item) => item.inboxId);

    const inboxItems = await getInboxItemsForEmbedding(db, { inboxIds });

    const inboxMap = new Map(inboxItems.map((item) => [item.id, item]));

    const validItems: Array<{ inboxId: string; text: string }> = [];

    for (const { inboxId } of items) {
      const inboxItem = inboxMap.get(inboxId);
      if (!inboxItem) {
        this.logger.warn("Inbox item not found for embedding", {
          inboxId,
          teamId,
        });
        continue;
      }

      if (!inboxItem.displayName && !inboxItem.website) {
        this.logger.warn("Inbox item has no embeddable content", {
          inboxId,
          teamId,
        });
        await updateInboxStatus(db, { id: inboxId, status: "pending" });
        continue;
      }

      const text = prepareInboxText({
        displayName: inboxItem.displayName ?? null,
        website: inboxItem.website ?? null,
      });

      if (!text || !text.trim()) {
        await updateInboxStatus(db, { id: inboxId, status: "pending" });
        continue;
      }

      validItems.push({ inboxId, text });
    }

    if (validItems.length === 0) {
      this.logger.info("No valid items to embed", {
        jobId: job.id,
        teamId,
      });
      return { totalItems: items.length, embedded: 0, skipped: items.length };
    }

    this.logger.info("Generating batch embeddings", {
      jobId: job.id,
      validCount: validItems.length,
      totalItems: items.length,
    });

    let embedded = 0;

    await processBatch(validItems, EMBED_BATCH_SIZE, async (batch) => {
      const texts = batch.map((item) => item.text);
      const { embeddings, model } = await generateEmbeddings(texts);

      if (embeddings.length !== batch.length) {
        throw new Error(
          `Embeddings count mismatch: expected ${batch.length}, got ${embeddings.length}`,
        );
      }

      const embeddingRecords = batch.map((item, idx) => {
        const embedding = embeddings[idx];
        if (!embedding) {
          throw new Error(`Missing embedding at index ${idx}`);
        }
        return {
          inboxId: item.inboxId,
          teamId,
          embedding,
          sourceText: item.text,
          model,
        };
      });

      await createInboxEmbeddings(db, { items: embeddingRecords });

      await Promise.allSettled(
        batch.map((item) =>
          updateInboxStatus(db, { id: item.inboxId, status: "pending" }),
        ),
      );

      embedded += batch.length;

      await job.updateProgress({
        status: "embedding",
        embedded,
        totalValid: validItems.length,
      });

      this.logger.info("Embedding batch completed", {
        jobId: job.id,
        batchSize: batch.length,
        totalEmbedded: embedded,
        remaining: validItems.length - embedded,
      });

      return batch;
    });

    // Trigger a single batch-process-matching job for all embedded items
    const embeddedInboxIds = validItems.map((item) => item.inboxId);

    try {
      await triggerJob(
        "batch-process-matching",
        { teamId, inboxIds: embeddedInboxIds },
        "inbox",
      );

      this.logger.info("Triggered batch-process-matching", {
        jobId: job.id,
        matchingCount: embeddedInboxIds.length,
      });
    } catch (error) {
      this.logger.error("Failed to trigger batch-process-matching", {
        jobId: job.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return {
      totalItems: items.length,
      embedded,
      skipped: items.length - embedded,
    };
  }
}
