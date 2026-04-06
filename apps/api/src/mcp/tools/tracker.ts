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
import {
  mcpTrackerEntrySchema,
  mcpTrackerProjectSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import {
  lenientDateTimeSchema,
  normalizeDateTime,
  truncateListResponse,
  withErrorHandling,
} from "../utils";

export const registerTrackerTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  const hasProjectReadScope = hasScope(ctx, "tracker-projects.read");
  const hasProjectWriteScope = hasScope(ctx, "tracker-projects.write");
  const hasEntryReadScope = hasScope(ctx, "tracker-entries.read");
  const hasEntryWriteScope = hasScope(ctx, "tracker-entries.write");

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

  if (hasProjectReadScope) {
    const { sort: _sort, ...trackerProjectsListFields } =
      getTrackerProjectsSchema.shape;

    server.registerTool(
      "tracker_projects_list",
      {
        title: "List Tracker Projects",
        description:
          "List time tracking projects with filtering by status (in_progress/completed), customer, project creation date range, tags (tag IDs from tags_list), and search. The start/end parameters filter by when the project was CREATED, not by when time was logged. To query time logged in a date range, use tracker_entries_list instead. Returns paginated results (default 25) with project name, billable rate, estimate, all-time total tracked hours, and customer.",
        inputSchema: {
          ...trackerProjectsListFields,
          sortBy: z
            .enum([
              "name",
              "created_at",
              "time",
              "amount",
              "assigned",
              "customer",
              "tags",
            ])
            .optional()
            .describe("Column to sort by"),
          sortDirection: z
            .enum(["asc", "desc"])
            .optional()
            .describe("Sort direction"),
        },
        outputSchema: {
          meta: z.looseObject({
            cursor: z.string().nullable().optional(),
            hasNextPage: z.boolean(),
            hasPreviousPage: z.boolean(),
          }),
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const sort = params.sortBy
          ? [params.sortBy, params.sortDirection ?? "desc"]
          : null;

        const result = await getTrackerProjects(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          status: params.status ?? null,
          customers: params.customers ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          sort,
          tags: params.tags ?? null,
        });

        const response = {
          meta: {
            cursor: result.meta.cursor ?? null,
            hasNextPage: result.meta.hasNextPage,
            hasPreviousPage: result.meta.hasPreviousPage,
          },
          data: sanitizeArray(mcpTrackerProjectSchema, result.data ?? []),
        };

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text" as const, text }],
          structuredContent,
        };
      }, "Failed to list tracker projects"),
    );

    server.registerTool(
      "tracker_projects_get",
      {
        title: "Get Tracker Project",
        description:
          "Get full details of a time tracking project by ID, including name, description, billable rate, currency, estimate, status, assigned customer, tags, and total tracked time.",
        inputSchema: {
          id: getTrackerProjectByIdSchema.shape.id,
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getTrackerProjectById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text" as const, text: "Project not found" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpTrackerProjectSchema, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get tracker project"),
    );
  }

  if (hasProjectWriteScope) {
    server.registerTool(
      "tracker_projects_create",
      {
        title: "Create Tracker Project",
        description:
          "Create a new time tracking project. Name is required. Optionally set billable rate, currency, hour estimate, customer link, and tags. Returns the created project.",
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
        try {
          const result = await upsertTrackerProject(db, {
            teamId,
            userId,
            name: params.name,
            description: params.description,
            estimate: params.estimate,
            billable: params.billable,
            rate: params.rate,
            currency: params.currency,
            customerId: params.customerId,
            tags: params.tags,
          });

          const clean = sanitize(mcpTrackerProjectSchema, result);

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
                    : "Failed to create project",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tracker_projects_update",
      {
        title: "Update Tracker Project",
        description:
          "Update an existing time tracking project. Provide the project ID and only the fields to change. Unspecified fields keep their current values.",
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
        try {
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

          const existingTags = existing.tags?.map((tag) => ({
            id: tag.id,
            value: tag.name ?? "",
          }));

          const result = await upsertTrackerProject(db, {
            id: params.id,
            teamId,
            userId,
            name: params.name ?? existing.name ?? "",
            description: params.description ?? existing.description,
            estimate: params.estimate ?? existing.estimate,
            billable: params.billable ?? existing.billable,
            rate: params.rate ?? existing.rate,
            currency: params.currency ?? existing.currency,
            customerId: params.customerId ?? existing.customerId,
            tags: params.tags ?? existingTags,
          });

          const clean = sanitize(mcpTrackerProjectSchema, result);

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
                    : "Failed to update project",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tracker_projects_delete",
      {
        title: "Delete Tracker Project",
        description:
          "Permanently delete a tracker project and all its associated time entries. This action cannot be undone.",
        inputSchema: {
          id: deleteTrackerProjectSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteTrackerProject(db, { id, teamId });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Project not found or already deleted",
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deletedId: result.id }),
              },
            ],
            structuredContent: { success: true, deletedId: result.id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete project",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  // ==========================================
  // TRACKER ENTRY TOOLS
  // ==========================================

  if (hasEntryReadScope) {
    server.registerTool(
      "tracker_entries_list",
      {
        title: "List Tracker Entries",
        description:
          "Query logged time / tracked hours within a date range. This is the primary tool for answering 'how much time was logged' questions. Optionally filter by project ID. Returns entries grouped by date with start/stop times, duration, description, project, and assigned user. meta.totalDuration contains the total seconds logged in the queried range. Both from and to dates are required (YYYY-MM-DD). Large ranges are automatically truncated — use narrower date ranges for complete data.",
        inputSchema: {
          from: z.string().describe("Start date (YYYY-MM-DD) — required"),
          to: z.string().describe("End date (YYYY-MM-DD) — required"),
          projectId: z
            .string()
            .uuid()
            .optional()
            .describe(
              "Only pass this if the user explicitly names or references a project. Omit for general time queries.",
            ),
        },
        outputSchema: {
          meta: z.looseObject({
            totalDuration: z.number(),
            totalAmount: z.number(),
            from: z.string(),
            to: z.string(),
          }),
          result: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await getTrackerRecordsByRange(db, {
          teamId,
          from: params.from,
          to: params.to,
          projectId: params.projectId,
        });

        const maxEntries = 500;
        const dates = Object.keys(result.result).sort().reverse();
        let entryCount = 0;
        const truncated: Record<string, unknown[]> = {};

        for (const date of dates) {
          const entries = result.result[date] as unknown[];
          if (entryCount + entries.length <= maxEntries) {
            truncated[date] = entries;
            entryCount += entries.length;
          } else {
            const remaining = maxEntries - entryCount;
            if (remaining > 0) {
              truncated[date] = entries.slice(0, remaining);
              entryCount += remaining;
            }
            break;
          }
        }

        const wasTruncated =
          entryCount < Object.values(result.result).flat().length;

        const sanitizedResult: Record<string, unknown[]> = {};
        for (const [date, entries] of Object.entries(truncated)) {
          sanitizedResult[date] = sanitizeArray(mcpTrackerEntrySchema, entries);
        }

        const response = {
          meta: {
            ...result.meta,
            ...(wasTruncated && {
              truncated: true,
              returnedEntries: entryCount,
              hint: "Use a narrower date range for complete data",
            }),
          },
          result: sanitizedResult,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(response) }],
          structuredContent: response,
        };
      }, "Failed to list tracker entries"),
    );

    server.registerTool(
      "tracker_timer_status",
      {
        title: "Get Timer Status",
        description:
          "Check if a timer is currently running and get elapsed time. Optionally filter by a specific user's timer using assignedId.",
        inputSchema: {
          assignedId: z
            .string()
            .uuid()
            .optional()
            .nullable()
            .describe("User ID to check timer for (optional)"),
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await getTimerStatus(db, {
          teamId,
          assignedId: params.assignedId,
        });

        const clean = sanitize(mcpTrackerEntrySchema, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get timer status"),
    );
  }

  if (hasEntryWriteScope) {
    server.registerTool(
      "tracker_entries_create",
      {
        title: "Create Tracker Entry",
        description:
          "Create a manual time tracking entry. Requires a project ID, at least one date (YYYY-MM-DD), start/stop times (ISO 8601 datetime, e.g. 2024-04-15T09:00:00Z), and duration in seconds. Optionally assign to a team member.",
        inputSchema: {
          projectId: upsertTrackerEntriesSchema.shape.projectId,
          dates: upsertTrackerEntriesSchema.shape.dates,
          start: lenientDateTimeSchema.describe(
            "Start time (ISO 8601 datetime)",
          ),
          stop: lenientDateTimeSchema.describe("Stop time (ISO 8601 datetime)"),
          duration: upsertTrackerEntriesSchema.shape.duration,
          description: upsertTrackerEntriesSchema.shape.description,
          assignedId: upsertTrackerEntriesSchema.shape.assignedId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await upsertTrackerEntries(db, {
            teamId,
            projectId: params.projectId,
            dates: params.dates,
            start: normalizeDateTime(params.start),
            stop: normalizeDateTime(params.stop),
            duration: params.duration,
            description: params.description,
            assignedId: params.assignedId ?? userId,
          });

          const clean = sanitizeArray(mcpTrackerEntrySchema, result ?? []);

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
                    : "Failed to create tracker entry",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tracker_entries_update",
      {
        title: "Update Tracker Entry",
        description:
          "Update an existing time entry. Provide the entry ID and only the fields to change. Unspecified fields keep their current values.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the entry to update"),
          projectId: upsertTrackerEntriesSchema.shape.projectId.optional(),
          start: lenientDateTimeSchema
            .optional()
            .describe("Start time (ISO 8601 datetime)"),
          stop: lenientDateTimeSchema
            .optional()
            .describe("Stop time (ISO 8601 datetime)"),
          duration: upsertTrackerEntriesSchema.shape.duration.optional(),
          description: upsertTrackerEntriesSchema.shape.description,
          assignedId: upsertTrackerEntriesSchema.shape.assignedId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
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

          const projectId = params.projectId ?? existing.projectId;
          const start = params.start
            ? normalizeDateTime(params.start)
            : existing.start;
          const stop = params.stop
            ? normalizeDateTime(params.stop)
            : existing.stop;

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

          const clean = sanitizeArray(mcpTrackerEntrySchema, result ?? []);

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
                    : "Failed to update tracker entry",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tracker_entries_delete",
      {
        title: "Delete Tracker Entry",
        description:
          "Permanently delete a time tracking entry by its ID. This action cannot be undone.",
        inputSchema: {
          id: deleteTrackerEntrySchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteTrackerEntry(db, { id, teamId });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Entry not found or already deleted",
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deletedId: result.id }),
              },
            ],
            structuredContent: { success: true, deletedId: result.id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete tracker entry",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tracker_timer_start",
      {
        title: "Start Timer",
        description:
          "Start a live timer for a project. Any currently running timer for the same user is stopped automatically. Returns the new entry being timed.",
        inputSchema: {
          projectId: startTimerSchema.shape.projectId,
          description: startTimerSchema.shape.description,
          assignedId: startTimerSchema.shape.assignedId,
          start: lenientDateTimeSchema
            .optional()
            .describe("Start time (ISO 8601). Defaults to now."),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await startTimer(db, {
            teamId,
            projectId: params.projectId,
            description: params.description,
            assignedId: params.assignedId ?? userId,
            start: params.start ? normalizeDateTime(params.start) : undefined,
          });

          const clean = sanitize(mcpTrackerEntrySchema, result);

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
                    : "Failed to start timer",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "tracker_timer_stop",
      {
        title: "Stop Timer",
        description:
          "Stop the currently running timer. Optionally specify an entry ID to stop a specific timer. Returns the completed time entry with final duration.",
        inputSchema: {
          entryId: stopTimerSchema.shape.entryId,
          assignedId: stopTimerSchema.shape.assignedId,
          stop: lenientDateTimeSchema
            .optional()
            .describe("Stop time (ISO 8601). Defaults to now."),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await stopTimer(db, {
            teamId,
            entryId: params.entryId,
            assignedId: params.assignedId ?? userId,
            stop: params.stop ? normalizeDateTime(params.stop) : undefined,
          });

          const clean = sanitize(mcpTrackerEntrySchema, result);

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
