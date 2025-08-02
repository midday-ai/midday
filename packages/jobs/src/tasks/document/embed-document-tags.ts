import { getDb } from "@jobs/init";
import {
  getDocumentTagEmbeddings,
  updateDocumentProcessingStatus,
  upsertDocumentTagAssignments,
  upsertDocumentTagEmbeddings,
  upsertDocumentTags,
} from "@midday/db/queries";
import { Embed } from "@midday/documents/embed";
import slugify from "@sindresorhus/slugify";
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const embedDocumentTags = schemaTask({
  id: "embed-document-tags",
  schema: z.object({
    documentId: z.string(),
    teamId: z.string(),
    tags: z.array(z.string()).min(1),
  }),
  queue: {
    concurrencyLimit: 25,
  },
  run: async ({ documentId, tags, teamId }) => {
    const embed = new Embed();

    // 1. Generate slugs for all incoming tags
    const tagsWithSlugs = tags.map((tag) => ({
      name: tag,
      slug: slugify(tag),
    }));

    const slugs = tagsWithSlugs.map((t) => t.slug);

    // 2. Check existing embeddings in document_tag_embeddings
    const existingEmbeddingsData = await getDocumentTagEmbeddings(getDb(), {
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
      const embedResult = await embed.embedMany(newTagNames);

      if (!embedResult || embedResult.length !== newTagNames.length) {
        console.error(
          "Embeddings result is missing or length mismatch:",
          embedResult,
        );
        throw new Error("Failed to generate embeddings for all new tags.");
      }

      const embeddings = embedResult;

      const newEmbeddingsToInsert = tagsToEmbed.map((tag, index) => ({
        name: tag.name,
        slug: tag.slug,
        embedding: JSON.stringify(embeddings[index]),
      }));

      // Upsert embeddings to handle potential race conditions or duplicates
      await upsertDocumentTagEmbeddings(getDb(), newEmbeddingsToInsert);

      console.log(
        `Successfully inserted/updated ${newEmbeddingsToInsert.length} embeddings.`,
      );
    } else {
      console.log("No new tags to embed.");
    }

    // 5. Upsert all tags into document_tags for the team
    const tagsToUpsert = tagsWithSlugs.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
      teamId: teamId,
    }));

    const upsertedTagsData = await upsertDocumentTags(getDb(), tagsToUpsert);

    if (!upsertedTagsData || upsertedTagsData.length === 0) {
      console.error("Upsert operation returned no data for document tags.");
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

      await upsertDocumentTagAssignments(getDb(), assignmentsToInsert);

      // Update the document processing status to completed
      await updateDocumentProcessingStatus(getDb(), {
        id: documentId,
        processingStatus: "completed",
      });
    } else {
      console.log(
        `No tags resulted from the upsert process for document ${documentId}, cannot assign.`,
      );
    }
  },
});
