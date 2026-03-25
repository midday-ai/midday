import { getTagById, getTags } from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerTagTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "tags.read")) {
    return;
  }

  server.registerTool(
    "tags_list",
    {
      title: "List Tags",
      description:
        "List all tags used for organizing transactions, projects, and documents. Returns tag ID, name, and color. Use these tag IDs when filtering other list tools.",
      inputSchema: {},
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      const result = await getTags(db, { teamId });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: { data: result },
      };
    },
  );

  server.registerTool(
    "tags_get",
    {
      title: "Get Tag",
      description: "Get a single tag by ID with its name and color.",
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
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: { data: result },
      };
    },
  );
};
