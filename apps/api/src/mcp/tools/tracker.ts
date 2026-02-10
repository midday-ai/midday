import {
  deleteTrackerEntrySchema,
  startTimerSchema,
  stopTimerSchema,
  upsertTrackerEntriesSchema,
} from "@api/schemas/tracker-entries";
import {
  deleteTrackerProjectSchema,
  getTrackerProjectByIdSchema,
  getTrackerProjectsSchema,
  upsertTrackerProjectSchema,
} from "@api/schemas/tracker-projects";
import {
  deleteTrackerEntry,
  deleteTrackerProject,
  getTimerStatus,
  getTrackerEntryById,
  getTrackerProjectById,
  getTrackerProjects,
  getTrackerRecordsByRange,
  startTimer,
  stopTimer,
  upsertTrackerEntries,
  upsertTrackerProject,
} from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

// Annotations for write operations
const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

// Annotations for destructive operations
const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const registerTrackerTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Check scopes
  const hasProjectReadScope = hasScope(ctx, "tracker-projects.read");
  const hasProjectWriteScope = hasScope(ctx, "tracker-projects.write");
  const hasEntryReadScope = hasScope(ctx, "tracker-entries.read");
  const hasEntryWriteScope = hasScope(ctx, "tracker-entries.write");

  // Skip if user has no tracker scopes
  if (
    !hasProjectReadScope &&
    !hasProjectWriteScope &&
    !hasEntryReadScope &&
    !hasEntryWriteScope
  ) {
    return;
  }

  // ==========================================
  // TRACKER PROJECT TOOLS
  // ==========================================

  // List projects (read scope)
  if (hasProjectReadScope) {
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

  // Create/Update project (write scope)
  if (hasProjectWriteScope) {
    server.registerTool(
      "tracker_projects_create",
      {
        title: "Create Tracker Project",
        description:
          "Create a new time tracking project. Specify name, optional description, rate, currency, estimate, and customer.",
        inputSchema: {
          name: upsertTrackerProjectSchema.shape.name,
          description: upsertTrackerProjectSchema.shape.description,
          estimate: upsertTrackerProjectSchema.shape.estimate,
          billable: upsertTrackerProjectSchema.shape.billable,
          rate: upsertTrackerProjectSchema.shape.rate,
          currency: upsertTrackerProjectSchema.shape.currency,
          customerId: upsertTrackerProjectSchema.shape.customerId,
          tags: upsertTrackerProjectSchema.shape.tags,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await upsertTrackerProject(db, {
          teamId,
          name: params.name,
          description: params.description,
          estimate: params.estimate,
          billable: params.billable,
          rate: params.rate,
          currency: params.currency,
          customerId: params.customerId,
          tags: params.tags,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "tracker_projects_update",
      {
        title: "Update Tracker Project",
        description:
          "Update an existing time tracking project. Provide the project ID and the fields to update.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the project to update"),
          name: upsertTrackerProjectSchema.shape.name.optional(),
          description: upsertTrackerProjectSchema.shape.description,
          estimate: upsertTrackerProjectSchema.shape.estimate,
          billable: upsertTrackerProjectSchema.shape.billable,
          rate: upsertTrackerProjectSchema.shape.rate,
          currency: upsertTrackerProjectSchema.shape.currency,
          customerId: upsertTrackerProjectSchema.shape.customerId,
          tags: upsertTrackerProjectSchema.shape.tags,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        // First check if project exists
        const existing = await getTrackerProjectById(db, {
          id: params.id,
          teamId,
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Project not found" }],
            isError: true,
          };
        }

        // Map existing tags from { id, name } to { id, value } format for upsert
        const existingTags = existing.tags?.map((tag) => ({
          id: tag.id,
          value: tag.name ?? "",
        }));

        const result = await upsertTrackerProject(db, {
          id: params.id,
          teamId,
          name: params.name ?? existing.name ?? "",
          description: params.description ?? existing.description,
          estimate: params.estimate ?? existing.estimate,
          billable: params.billable ?? existing.billable,
          rate: params.rate ?? existing.rate,
          currency: params.currency ?? existing.currency,
          customerId: params.customerId ?? existing.customerId,
          tags: params.tags ?? existingTags,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "tracker_projects_delete",
      {
        title: "Delete Tracker Project",
        description:
          "Delete a tracker project by its ID. This will also delete all associated time entries.",
        inputSchema: {
          id: deleteTrackerProjectSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await deleteTrackerProject(db, { id, teamId });

        if (!result) {
          return {
            content: [
              { type: "text", text: "Project not found or already deleted" },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, deletedId: result.id },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  }

  // ==========================================
  // TRACKER ENTRY TOOLS
  // ==========================================

  // List entries (read scope)
  if (hasEntryReadScope) {
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

    server.registerTool(
      "tracker_timer_status",
      {
        title: "Get Timer Status",
        description:
          "Get the current timer status including whether a timer is running and elapsed time",
        inputSchema: {
          assignedId: z
            .string()
            .uuid()
            .optional()
            .nullable()
            .describe("User ID to check timer for (optional)"),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getTimerStatus(db, {
          teamId,
          assignedId: params.assignedId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }

  // Create/Update/Delete entries (write scope)
  if (hasEntryWriteScope) {
    server.registerTool(
      "tracker_entries_create",
      {
        title: "Create Tracker Entry",
        description:
          "Create a new time tracking entry. Specify project, dates, start/stop times, and duration.",
        inputSchema: {
          projectId: upsertTrackerEntriesSchema.shape.projectId,
          dates: upsertTrackerEntriesSchema.shape.dates,
          start: upsertTrackerEntriesSchema.shape.start,
          stop: upsertTrackerEntriesSchema.shape.stop,
          duration: upsertTrackerEntriesSchema.shape.duration,
          description: upsertTrackerEntriesSchema.shape.description,
          assignedId: upsertTrackerEntriesSchema.shape.assignedId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await upsertTrackerEntries(db, {
          teamId,
          projectId: params.projectId,
          dates: params.dates,
          start: params.start,
          stop: params.stop,
          duration: params.duration,
          description: params.description,
          assignedId: params.assignedId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "tracker_entries_update",
      {
        title: "Update Tracker Entry",
        description:
          "Update an existing time tracking entry. Provide the entry ID and only the fields you want to update.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the entry to update"),
          projectId: upsertTrackerEntriesSchema.shape.projectId.optional(),
          start: upsertTrackerEntriesSchema.shape.start.optional(),
          stop: upsertTrackerEntriesSchema.shape.stop.optional(),
          duration: upsertTrackerEntriesSchema.shape.duration.optional(),
          description: upsertTrackerEntriesSchema.shape.description,
          assignedId: upsertTrackerEntriesSchema.shape.assignedId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        // Fetch the existing entry
        const existing = await getTrackerEntryById(db, {
          id: params.id,
          teamId,
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Entry not found" }],
            isError: true,
          };
        }

        // Validate that we have required fields from either params or existing
        const projectId = params.projectId ?? existing.projectId;
        const start = params.start ?? existing.start;
        const stop = params.stop ?? existing.stop;

        if (!projectId || !start || !stop) {
          return {
            content: [
              {
                type: "text",
                text: "Entry is missing required fields (projectId, start, or stop). Please provide them.",
              },
            ],
            isError: true,
          };
        }

        const result = await upsertTrackerEntries(db, {
          id: params.id,
          teamId,
          projectId,
          dates: existing.date ? [existing.date] : [],
          start,
          stop,
          duration: params.duration ?? existing.duration ?? 0,
          description: params.description ?? existing.description,
          assignedId: params.assignedId ?? existing.assignedId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "tracker_entries_delete",
      {
        title: "Delete Tracker Entry",
        description: "Delete a time tracking entry by its ID",
        inputSchema: {
          id: deleteTrackerEntrySchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await deleteTrackerEntry(db, { id, teamId });

        if (!result) {
          return {
            content: [
              { type: "text", text: "Entry not found or already deleted" },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, deletedId: result.id },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    // Timer tools
    server.registerTool(
      "tracker_timer_start",
      {
        title: "Start Timer",
        description:
          "Start a new timer for a project. Any currently running timer will be stopped automatically.",
        inputSchema: {
          projectId: startTimerSchema.shape.projectId,
          description: startTimerSchema.shape.description,
          assignedId: startTimerSchema.shape.assignedId,
          start: startTimerSchema.shape.start,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await startTimer(db, {
          teamId,
          projectId: params.projectId,
          description: params.description,
          assignedId: params.assignedId,
          start: params.start,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "tracker_timer_stop",
      {
        title: "Stop Timer",
        description:
          "Stop the current running timer. Optionally specify a specific entry ID to stop.",
        inputSchema: {
          entryId: stopTimerSchema.shape.entryId,
          assignedId: stopTimerSchema.shape.assignedId,
          stop: stopTimerSchema.shape.stop,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await stopTimer(db, {
            teamId,
            entryId: params.entryId,
            assignedId: params.assignedId,
            stop: params.stop,
          });

          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to stop timer",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
