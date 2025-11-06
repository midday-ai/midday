import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getTrackerProjects, startTimer } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const startTimerSchema = z.object({
  projectName: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Project name to search for. If multiple projects match, the first one will be used.",
    ),
  projectId: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Direct project ID (UUID). Use this if you know the exact project ID. Alternative to projectName.",
    ),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Optional description for the timer."),
  assignedId: z
    .string()
    .nullable()
    .optional()
    .describe(
      "User ID to assign the timer to. If not provided, will use the current user from context.",
    ),
});

export const startTimerTool = tool({
  description:
    "Start a timer for a tracker project. This will stop any currently running timer for the user and start a new one. Use this when users want to start tracking time on a project.",
  inputSchema: startTimerSchema,
  execute: async function* (
    { projectName, projectId, description, assignedId },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;
    const userId = assignedId || appContext.userId || null;

    if (!teamId) {
      yield {
        text: "Unable to start timer: Team ID not found in context.",
      };
      return;
    }

    try {
      // Find project by name or use provided projectId
      let finalProjectId = projectId;

      if (!finalProjectId && projectName) {
        // Search for project by name
        const projectsResult = await getTrackerProjects(db, {
          teamId,
          q: projectName,
          pageSize: 5,
        });

        if (projectsResult.data.length === 0) {
          yield {
            text: `No project found matching "${projectName}". Please check the project name or provide a project ID.`,
          };
          return;
        }

        // Use the first matching project
        finalProjectId = projectsResult.data[0]?.id || null;

        // If multiple matches, mention it but use the first one
        if (projectsResult.data.length > 1 && projectsResult.data[0]) {
          const projectNames = projectsResult.data
            .map((p) => p.name)
            .join(", ");
          yield {
            text: `Multiple projects found matching "${projectName}". Using "${projectsResult.data[0].name}". Other matches: ${projectNames}`,
          };
        }
      }

      if (!finalProjectId) {
        yield {
          text: "Please provide either a projectName or projectId to start a timer.",
        };
        return;
      }

      // Start the timer
      const result = await startTimer(db, {
        teamId,
        projectId: finalProjectId,
        assignedId: userId,
        description: description || null,
      });

      const startTime = result.start
        ? formatDate(result.start, "HH:mm")
        : "now";

      const response = `Timer started successfully!\n\n**Project:** ${result.project?.name || "Unknown"}\n**Started at:** ${startTime}\n**Description:** ${result.description || "None"}`;

      yield {
        text: response,
        link: {
          text: "View tracker",
          url: `${getAppUrl()}/tracker`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to start timer: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
