import { Embed } from "@midday/documents/embed";
import { createClient } from "@midday/supabase/job";
import slugify from "@sindresorhus/slugify";
import { schemaTask } from "@trigger.dev/sdk/v3";
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
    const supabase = createClient();
    const embed = new Embed();

    // 1. Generate slugs for all incoming tags
    const tagsWithSlugs = tags.map((tag) => ({
      name: tag,
      slug: slugify(tag),
    }));
    const slugs = tagsWithSlugs.map((t) => t.slug);

    // 2. Check existing embeddings in document_tag_embeddings
    const { data: existingEmbeddingsData, error: existingEmbeddingsError } =
      await supabase
        .from("document_tag_embeddings")
        .select("slug")
        .in("slug", slugs);

    if (existingEmbeddingsError) {
      console.error(
        "Error fetching existing embeddings:",
        existingEmbeddingsError,
      );
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
      const { error: insertEmbeddingsError } = await supabase
        .from("document_tag_embeddings")
        .upsert(newEmbeddingsToInsert, { onConflict: "slug" });

      if (insertEmbeddingsError) {
        console.error("Error inserting new embeddings:", insertEmbeddingsError);
        throw new Error(
          `Failed to insert new embeddings: ${insertEmbeddingsError.message}`,
        );
      }
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
      team_id: teamId,
    }));

    const { data: upsertedTagsData, error: upsertTagsError } = await supabase
      .from("document_tags")
      .upsert(tagsToUpsert, {
        onConflict: "slug, team_id",
      })
      .select("id, slug");

    if (upsertTagsError) {
      console.error("Error upserting document tags:", upsertTagsError);
      throw new Error(
        `Failed to upsert document tags: ${upsertTagsError.message}`,
      );
    }

    if (!upsertedTagsData || upsertedTagsData.length === 0) {
      console.error("Upsert operation returned no data for document tags.");
      throw new Error("Failed to get IDs from upserted document tags.");
    }

    const allTagIds = upsertedTagsData.map((t) => t.id);

    // 6. Create assignments in document_tag_assignments using upsert
    if (allTagIds.length > 0) {
      const assignmentsToInsert = allTagIds.map((tagId) => ({
        document_id: documentId,
        tag_id: tagId,
        team_id: teamId, // Include team_id here as well
      }));

      const { error: assignmentError } = await supabase
        .from("document_tag_assignments")
        .upsert(assignmentsToInsert, {
          onConflict: "document_id, tag_id",
        });

      if (assignmentError) {
        console.error("Error creating tag assignments:", assignmentError);
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
    } else {
      console.log(
        `No tags resulted from the upsert process for document ${documentId}, cannot assign.`,
      );
    }
  },
});
