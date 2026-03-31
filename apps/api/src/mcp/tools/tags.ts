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
import { mcpTagResponseSchema, sanitize, sanitizeArray } from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import { withErrorHandling } from "../utils";

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
          "List all transaction/project tags. Returns tag ID and name. Use these tag IDs for the tags filter in transactions_list and tracker_projects_list. For document tags, use document_tags_list instead.",
        inputSchema: {},
        outputSchema: {
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async () => {
        const result = await getTags(db, { teamId });

        const clean = sanitizeArray(mcpTagResponseSchema, result ?? []);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to list tags"),
    );

    server.registerTool(
      "tags_get",
      {
        title: "Get Tag",
        description:
          "Get a single transaction/project tag by ID. Returns the tag name. Use tags_list to find available tag IDs before looking up details.",
        inputSchema: {
          id: z.string().uuid().describe("Tag ID"),
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getTagById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Tag not found" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpTagResponseSchema, result);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get tag"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "tags_create",
      {
        title: "Create Tag",
        description:
          "Create a new transaction/project tag. Tags can be used to label and filter transactions in transactions_list and projects in tracker_projects_list. Use tags_list first to check if the tag already exists.",
        inputSchema: createTagSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await createTag(db, { teamId, ...params });

          if (!result) {
            return {
              content: [{ type: "text", text: "Failed to create tag" }],
              isError: true,
            };
          }

          const clean = sanitize(mcpTagResponseSchema, result);

          return {
            content: [{ type: "text", text: JSON.stringify(clean) }],
            structuredContent: { data: clean },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to create tag",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tags_update",
      {
        title: "Update Tag",
        description:
          "Rename an existing transaction/project tag by ID. The updated name will apply to all transactions and projects that use this tag.",
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

          const clean = sanitize(mcpTagResponseSchema, result);

          return {
            content: [{ type: "text", text: JSON.stringify(clean) }],
            structuredContent: { data: clean },
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
        description:
          "Delete a transaction/project tag by ID. Removes the tag from all transactions and projects it was applied to. This action cannot be undone.",
        inputSchema: deleteTagSchema.shape,
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await deleteTag(db, { id: params.id, teamId });

        if (!result) {
          return {
            content: [
              { type: "text", text: "Tag not found or could not be deleted" },
            ],
            isError: true,
          };
        }

        const clean = sanitize(mcpTagResponseSchema, result);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to delete tag"),
    );
  }
};
