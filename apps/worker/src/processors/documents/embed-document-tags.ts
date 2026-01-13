import {
  getDocumentTagEmbeddings,
  upsertDocumentTagAssignments,
  upsertDocumentTagEmbeddings,
  upsertDocumentTags,
} from "@midday/db/queries";
import { Embed } from "@midday/documents/embed";
import slugify from "@sindresorhus/slugify";
import type { Job } from "bullmq";
import type { EmbedDocumentTagsPayload } from "../../schemas/documents";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";

/**
 * Embed document tags and create tag assignments
 * This enriches documents with tag embeddings for better searchability
 */
export class EmbedDocumentTagsProcessor extends BaseProcessor<EmbedDocumentTagsPayload> {
  async process(job: Job<EmbedDocumentTagsPayload>): Promise<void> {
    const { documentId, tags, teamId } = job.data;
    const db = getDb();

    this.logger.info("Embedding document tags", {
      documentId,
      tagsCount: tags.length,
      teamId,
    });

    const embed = new Embed();

    // 1. Generate slugs for all incoming tags
    const tagsWithSlugs = tags.map((tag) => ({
      name: tag,
      slug: slugify(tag),
    }));

    const slugs = tagsWithSlugs.map((t) => t.slug);

    // 2. Check existing embeddings in document_tag_embeddings
    const existingEmbeddingsData = await getDocumentTagEmbeddings(db, {
      slugs,
    });

    const existingEmbeddingSlugs = new Set(
      existingEmbeddingsData.map((e: { slug: string }) => e.slug),
    );

    // 3. Identify tags needing new embeddings
    const tagsToEmbed = tagsWithSlugs.filter(
      (tag) => !existingEmbeddingSlugs.has(tag.slug),
    );
    const newTagNames = tagsToEmbed.map((t) => t.name);

    // 4. Generate and insert new embeddings if any
    if (newTagNames.length > 0) {
      this.logger.info("Generating embeddings for new tags", {
        documentId,
        newTagsCount: newTagNames.length,
      });

      const { embeddings, model } = await withTimeout(
        embed.embedMany(newTagNames),
        TIMEOUTS.EMBEDDING,
        `Embedding generation timed out after ${TIMEOUTS.EMBEDDING}ms`,
      );

      if (!embeddings || embeddings.length !== newTagNames.length) {
        this.logger.error("Embeddings result is missing or length mismatch", {
          documentId,
          embeddingsLength: embeddings?.length,
          expectedLength: newTagNames.length,
        });
        throw new Error("Failed to generate embeddings for all new tags.");
      }

      const newEmbeddingsToInsert = tagsToEmbed.map((tag, index) => ({
        name: tag.name,
        slug: tag.slug,
        embedding: JSON.stringify(embeddings[index]),
        model,
      }));

      // Upsert embeddings to handle potential race conditions or duplicates
      await upsertDocumentTagEmbeddings(db, newEmbeddingsToInsert);

      this.logger.info("Successfully inserted/updated embeddings", {
        documentId,
        insertedCount: newEmbeddingsToInsert.length,
      });
    } else {
      this.logger.info("No new tags to embed", {
        documentId,
      });
    }

    // 5. Upsert all tags into document_tags for the team
    const tagsToUpsert = tagsWithSlugs.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
      teamId: teamId,
    }));

    const upsertedTagsData = await upsertDocumentTags(db, tagsToUpsert);

    if (!upsertedTagsData || upsertedTagsData.length === 0) {
      this.logger.error("Upsert operation returned no data for document tags", {
        documentId,
      });
      throw new Error("Failed to get IDs from upserted document tags.");
    }

    const allTagIds = upsertedTagsData.map(
      (t: { id: string; slug: string }) => t.id,
    );

    // 6. Create assignments in document_tag_assignments using upsert
    if (allTagIds.length > 0) {
      const assignmentsToInsert = allTagIds.map((tagId: string) => ({
        documentId: documentId,
        tagId: tagId,
        teamId: teamId,
      }));

      await upsertDocumentTagAssignments(db, assignmentsToInsert);

      this.logger.info("Document tags embedded and assigned successfully", {
        documentId,
        tagsAssigned: allTagIds.length,
      });
    } else {
      this.logger.warn(
        "No tags resulted from the upsert process, cannot assign",
        {
          documentId,
        },
      );
    }
  }
}
