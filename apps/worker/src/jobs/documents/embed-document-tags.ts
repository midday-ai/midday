import { Embed } from "@midday/documents/embed";
import { createClient } from "@midday/supabase/job";
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

    const supabase = createClient();
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
      const { data: existingEmbeddingsData, error: existingEmbeddingsError } =
        await supabase
          .from("document_tag_embeddings")
          .select("slug")
          .in("slug", slugs);

      if (existingEmbeddingsError) {
        throw new Error(
          `Failed to fetch existing embeddings: ${existingEmbeddingsError.message}`,
        );
      }

      const existingEmbeddingSlugs = new Set(
        (existingEmbeddingsData || []).map((e: { slug: string }) => e.slug),
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
        const { error: insertEmbeddingsError } = await supabase
          .from("document_tag_embeddings")
          .upsert(newEmbeddingsToInsert, { onConflict: "slug" });

        if (insertEmbeddingsError) {
          throw new Error(
            `Failed to insert new embeddings: ${insertEmbeddingsError.message}`,
          );
        }

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
        team_id: teamId,
      }));

      const { data: upsertedTagsData, error: upsertTagsError } = await supabase
        .from("document_tags")
        .upsert(tagsToUpsert, {
          onConflict: "slug, team_id",
        })
        .select("id, slug");

      if (upsertTagsError) {
        throw new Error(
          `Failed to upsert document tags: ${upsertTagsError.message}`,
        );
      }

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
          document_id: documentId,
          tag_id: tagId,
          team_id: teamId,
        }));

        const { error: assignmentError } = await supabase
          .from("document_tag_assignments")
          .upsert(assignmentsToInsert, {
            onConflict: "document_id, tag_id",
          });

        if (assignmentError) {
          throw new Error(
            `Failed to create tag assignments: ${assignmentError.message}`,
          );
        }

        // Update the document processing status to completed
        await supabase
          .from("documents")
          .update({
            processing_status: "completed",
          })
          .eq("id", documentId);

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
      await supabase
        .from("documents")
        .update({
          processing_status: "failed",
        })
        .eq("id", documentId);

      throw error;
    }
  },
);
