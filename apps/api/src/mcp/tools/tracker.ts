import {
  getTrackerProjectByIdSchema,
  getTrackerProjectsSchema,
} from "@api/schemas/tracker-projects";
import {
  getTrackerProjectById,
  getTrackerProjects,
  getTrackerRecordsByRange,
} from "@midday/db/queries";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, type RegisterTools, hasScope } from "../types";

export const registerTrackerTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require tracker-projects.read scope for project tools
  const hasProjectScope = hasScope(ctx, "tracker-projects.read");
  // Require tracker-entries.read scope for entry tools
  const hasEntryScope = hasScope(ctx, "tracker-entries.read");

  // Skip if user has neither scope
  if (!hasProjectScope && !hasEntryScope) {
    return;
  }

  // Register project tools if user has tracker-projects.read scope
  if (hasProjectScope) {
    server.registerTool(
      "tracker_projects_list",
      {
        title: "List Tracker Projects",
        description:
          "List time tracking projects with filtering by status, customer, and date range",
        inputSchema: getTrackerProjectsSchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getTrackerProjects(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          status: params.status ?? null,
          customers: params.customers ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          sort: params.sort ?? null,
          tags: params.tags ?? null,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "tracker_projects_get",
      {
        title: "Get Tracker Project",
        description: "Get a specific tracker project by its ID",
        inputSchema: {
          id: getTrackerProjectByIdSchema.shape.id,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getTrackerProjectById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Project not found" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }

  // Register entry tools if user has tracker-entries.read scope
  if (hasEntryScope) {
    server.registerTool(
      "tracker_entries_list",
      {
        title: "List Tracker Entries",
        description:
          "List time tracking entries with filtering by project and date range",
        inputSchema: {
          from: z.string().describe("Start date (YYYY-MM-DD) - required"),
          to: z.string().describe("End date (YYYY-MM-DD) - required"),
          projectId: z
            .string()
            .uuid()
            .optional()
            .describe("Filter by project ID"),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getTrackerRecordsByRange(db, {
          teamId,
          from: params.from,
          to: params.to,
          projectId: params.projectId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }
};
