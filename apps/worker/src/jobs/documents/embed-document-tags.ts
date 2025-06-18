import {
  getDocumentTagEmbeddings,
  updateDocumentProcessingStatusById,
  upsertDocumentTagAssignments,
  upsertDocumentTagEmbeddings,
  upsertDocumentTags,
} from "@midday/db/queries";
import { Embed } from "@midday/documents/embed";
import slugify from "@sindresorhus/slugify";
import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import { z } from "zod";

export const embedDocumentTagsJob = job(
  "embed-document-tags",
  z.object({
    documentId: z.string().uuid(),
    teamId: z.string().uuid(),
    tags: z.array(z.string()).min(1),
  }),
  {
    queue: documentsQueue,
    attempts: 3,
    priority: 3, // Higher priority for embedding to complete document processing
    removeOnComplete: 100,
  },
  async ({ documentId, tags, teamId }, ctx) => {
    ctx.logger.info("Embedding document tags", {
      documentId,
      teamId,
      tagsCount: tags.length,
      tags: tags.slice(0, 5), // Log first 5 tags for debugging
    });

    const embed = new Embed();

    try {
      // 1. Generate slugs for all incoming tags
      const tagsWithSlugs = tags.map((tag) => ({
        name: tag,
        slug: slugify(tag),
      }));
      const slugs = tagsWithSlugs.map((t) => t.slug);

      ctx.logger.info("Generated tag slugs", {
        documentId,
        originalTags: tags.length,
        slugs: slugs.slice(0, 5),
      });

      // 2. Check existing embeddings in document_tag_embeddings
      const existingEmbeddingsData = await getDocumentTagEmbeddings(ctx.db, {
        slugs,
      });

      const existingEmbeddingSlugs = new Set(
        existingEmbeddingsData.map((e) => e.slug),
      );

      // 3. Identify tags needing new embeddings
      const tagsToEmbed = tagsWithSlugs.filter(
        (tag) => !existingEmbeddingSlugs.has(tag.slug),
      );
      const newTagNames = tagsToEmbed.map((t) => t.name);

      ctx.logger.info("Tags embedding analysis", {
        documentId,
        totalTags: tagsWithSlugs.length,
        existingEmbeddings: existingEmbeddingSlugs.size,
        newTagsToEmbed: newTagNames.length,
      });

      // 4. Generate and insert new embeddings if any
      if (newTagNames.length > 0) {
        ctx.logger.info("Generating new embeddings", {
          documentId,
          newTagsCount: newTagNames.length,
        });

        const embedResult = await embed.embedMany(newTagNames);

        if (!embedResult || embedResult.length !== newTagNames.length) {
          throw new Error("Failed to generate embeddings for all new tags");
        }

        const embeddings = embedResult;

        const newEmbeddingsToInsert = tagsToEmbed.map((tag, index) => ({
          name: tag.name,
          slug: tag.slug,
          embedding: JSON.stringify(embeddings[index]),
        }));

        // Upsert embeddings to handle potential race conditions or duplicates
        await upsertDocumentTagEmbeddings(ctx.db, newEmbeddingsToInsert);

        ctx.logger.info("Successfully inserted new embeddings", {
          documentId,
          insertedCount: newEmbeddingsToInsert.length,
        });
      } else {
        ctx.logger.info("No new tags to embed", { documentId });
      }

      // 5. Upsert all tags into document_tags for the team
      const tagsToUpsert = tagsWithSlugs.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        teamId: teamId,
      }));

      const upsertedTagsData = await upsertDocumentTags(ctx.db, tagsToUpsert);

      if (!upsertedTagsData || upsertedTagsData.length === 0) {
        throw new Error("Failed to get IDs from upserted document tags");
      }

      const allTagIds = upsertedTagsData.map((t) => t.id);

      ctx.logger.info("Upserted document tags", {
        documentId,
        tagIds: allTagIds.length,
      });

      // 6. Create assignments in document_tag_assignments using upsert
      if (allTagIds.length > 0) {
        const assignmentsToInsert = allTagIds.map((tagId) => ({
          documentId: documentId,
          tagId: tagId,
          teamId: teamId,
        }));

        await upsertDocumentTagAssignments(ctx.db, assignmentsToInsert);

        // Update the document processing status to completed
        await updateDocumentProcessingStatusById(ctx.db, {
          id: documentId,
          processingStatus: "completed",
        });

        ctx.logger.info("Document tag embedding completed", {
          documentId,
          assignedTags: allTagIds.length,
          status: "completed",
        });
      } else {
        ctx.logger.warn("No tags resulted from upsert process", {
          documentId,
        });
      }

      return {
        documentId,
        teamId,
        processed: true,
        tagsProcessed: allTagIds.length,
        newEmbeddings: newTagNames.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      ctx.logger.error("Tag embedding failed", {
        documentId,
        teamId,
        error: errorMessage,
        errorType: error?.constructor?.name,
      });

      // Update document processing status to failed
      await updateDocumentProcessingStatusById(ctx.db, {
        id: documentId,
        processingStatus: "failed",
      });

      throw error;
    }
  },
);
