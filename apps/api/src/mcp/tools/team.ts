import { getTeamById, getTeamMembers } from "@midday/db/queries";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

export const registerTeamTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require teams.read scope
  if (!hasScope(ctx, "teams.read")) {
    return;
  }
  server.registerTool(
    "team_get",
    {
      title: "Get Team Info",
      description:
        "Get information about the current team including name, settings, and base currency.",
      inputSchema: {},
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
      };
    },
  );

  server.registerTool(
    "team_members",
    {
      title: "List Team Members",
      description: "List all members of the current team with their roles.",
      inputSchema: {},
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async () => {
      const result = await getTeamMembers(db, teamId);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
