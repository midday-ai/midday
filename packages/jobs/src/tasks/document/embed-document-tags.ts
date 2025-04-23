import { Embed } from "@midday/documents/embed";
import { createClient } from "@midday/supabase/job";
import slugify from "@sindresorhus/slugify";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const embedDocumentTags = schemaTask({
  id: "embed-document-tags",
  schema: z.object({
    documentId: z.string(),
    tags: z.array(z.string()).min(1), // Ensure tags array is not empty
  }),
  queue: {
    concurrencyLimit: 25,
  },
  run: async ({ documentId, tags }) => {
    const supabase = createClient();
    const embed = new Embed();

    // 1. Find existing tags by title
    const { data: existingTagsData, error: existingTagsError } = await supabase
      .from("document_tags")
      .select("id, title") // Select title instead of tag
      .in("title", tags); // Filter by title

    if (existingTagsError) {
      console.error("Error fetching existing tags:", existingTagsError);
      throw new Error(
        `Failed to fetch existing tags: ${existingTagsError.message}`,
      );
    }

    // Type assertion for safety, assuming data is not null if no error
    const typedExistingTagsData =
      (existingTagsData as { id: string; title: string }[]) || [];

    const existingTagsMap = new Map(
      typedExistingTagsData.map((t) => [t.title, t.id]), // Map title to id
    );
    const existingTagIds = typedExistingTagsData.map((t) => t.id);

    // 2. Identify new tags
    const newTags = tags.filter((tag) => !existingTagsMap.has(tag));
    let newTagIds: string[] = [];

    // 3. Embed and insert new tags if any
    if (newTags.length > 0) {
      // Get embeddings from the result object
      const embedResult = await embed.embedMany(newTags);

      // Add check for embeddings existence and length
      if (!embedResult || embedResult.length !== newTags.length) {
        console.error(
          "Embeddings result is missing or length mismatch:",
          embedResult,
        );
        throw new Error("Failed to generate embeddings for all new tags.");
      }

      const embeddings = embedResult;

      const newTagsToInsert = newTags.map((tag, index) => ({
        title: tag,
        slug: slugify(tag),
        embedding: JSON.stringify(embeddings[index]),
      }));

      const { data: insertedTagsData, error: insertTagsError } = await supabase
        .from("document_tags")
        .insert(newTagsToInsert)
        .select("id");

      if (insertTagsError) {
        console.error("Error inserting new tags:", insertTagsError);
        throw new Error(
          `Failed to insert new tags: ${insertTagsError.message}`,
        );
      }
      // Type assertion for safety
      // Explicitly check insertedTagsData before mapping
      if (insertedTagsData) {
        newTagIds = (insertedTagsData as { id: string }[]).map((t) => t.id);
      } else {
        // Handle the case where insert succeeded but returned no data (optional, could also log warning)
        newTagIds = [];
      }
    }

    // 4. Combine all relevant tag IDs
    const allTagIds = [...existingTagIds, ...newTagIds];

    // 5. Create assignments in document_tag_assignments using upsert
    if (allTagIds.length > 0) {
      const assignmentsToInsert = allTagIds.map((tagId) => ({
        document_id: documentId,
        tag_id: tagId,
      }));

      // Use upsert directly on the table reference
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
      console.log(
        `Successfully assigned ${allTagIds.length} tags to document ${documentId}`,
      );
    } else {
      console.log(`No tags to assign for document ${documentId}`);
    }
  },
});
