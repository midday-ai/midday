import { getTeamById, getTeamMembers } from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

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
        "Get current team details including name, base currency, locale, timezone, and settings. Call this first when you need to know the team's default currency or locale for formatting.",
      inputSchema: {},
      outputSchema: {
        data: z.record(z.string(), z.any()),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      const result = await getTeamById(db, teamId);

      if (!result) {
        return {
          content: [{ type: "text", text: "Team not found" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: { data: result },
      };
    },
  );

  server.registerTool(
    "team_members",
    {
      title: "List Team Members",
      description:
        "List all members of the current team with their user ID, name, email, avatar, and role. Use member IDs as assignedId when creating tracker entries.",
      inputSchema: {},
      outputSchema: {
        data: z.array(z.record(z.string(), z.any())),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      const result = await getTeamMembers(db, teamId);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: { data: result },
      };
    },
  );
};
