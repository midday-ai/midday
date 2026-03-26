import { getTeamById, getTeamMembers } from "@midday/db/queries";
import { z } from "zod";
import {
  mcpTeamMemberSchema,
  mcpTeamSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";
import { withErrorHandling } from "../utils";

export const registerTeamTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  if (!hasScope(ctx, "teams.read")) {
    return;
  }

  server.registerTool(
    "team_get",
    {
      title: "Get Team Info",
      description:
        "Get current team details including name, base currency, country code, plan, and fiscal year settings. Call this first when you need to know the team's default currency for formatting.",
      inputSchema: {},
      outputSchema: {
        data: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async () => {
      const result = await getTeamById(db, teamId);

      if (!result) {
        return {
          content: [{ type: "text", text: "Team not found" }],
          isError: true,
        };
      }

      const clean = sanitize(mcpTeamSchema, result);

      return {
        content: [{ type: "text", text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to get team info"),
  );

  server.registerTool(
    "team_members",
    {
      title: "List Team Members",
      description:
        "List all members of the current team with their user ID, name, email, avatar, and role. Use the user ID from the response as assignedId when assigning transactions or creating tracker entries.",
      inputSchema: {},
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async () => {
      const result = await getTeamMembers(db, teamId);

      const clean = sanitizeArray(mcpTeamMemberSchema, result ?? []);

      return {
        content: [{ type: "text", text: JSON.stringify(clean) }],
        structuredContent: { data: clean },
      };
    }, "Failed to list team members"),
  );
};
