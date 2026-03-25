import {
  createTagSchema,
  deleteTagSchema,
  updateTagSchema,
} from "@api/schemas/tags";
import {
  createTag,
  deleteTag,
  getTagById,
  getTags,
  updateTag,
} from "@midday/db/queries";
import { z } from "zod";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";

export const registerTagTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "tags.read");
  const hasWriteScope = hasScope(ctx, "tags.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    server.registerTool(
      "tags_list",
      {
        title: "List Tags",
        description:
          "List all tags used for organizing transactions, projects, and documents. Returns tag ID and name. Use these tag IDs when filtering other list tools.",
        inputSchema: {},
        outputSchema: {
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async () => {
        const result = await getTags(db, { teamId });

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      },
    );

    server.registerTool(
      "tags_get",
      {
        title: "Get Tag",
        description: "Get a single tag by ID with its name.",
        inputSchema: {
          id: z.string().uuid().describe("Tag ID"),
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getTagById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Tag not found" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      },
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "tags_create",
      {
        title: "Create Tag",
        description: "Create a new tag for the team.",
        inputSchema: createTagSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await createTag(db, { teamId, ...params });

        if (!result) {
          return {
            content: [{ type: "text", text: "Failed to create tag" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      },
    );

    server.registerTool(
      "tags_update",
      {
        title: "Update Tag",
        description: "Rename an existing tag by ID.",
        inputSchema: updateTagSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await updateTag(db, {
            id: params.id,
            name: params.name,
            teamId,
          });

          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
            structuredContent: { data: result },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Tag not found or update failed",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tags_delete",
      {
        title: "Delete Tag",
        description: "Delete a tag by ID.",
        inputSchema: deleteTagSchema.shape,
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async (params) => {
        const result = await deleteTag(db, { id: params.id, teamId });

        if (!result) {
          return {
            content: [
              { type: "text", text: "Tag not found or could not be deleted" },
            ],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      },
    );
  }
};
