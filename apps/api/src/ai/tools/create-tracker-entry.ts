import type { AppContext } from "@api/ai/agents/config/shared";
import { tz } from "@date-fns/tz";
import { db } from "@midday/db/client";
import { getTrackerProjects, upsertTrackerEntries } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { formatDistance, setHours, setMinutes } from "date-fns";
import parseDuration from "parse-duration";
import { z } from "zod";

const createTrackerEntrySchema = z.object({
  projectName: z.string().nullable().optional().describe("Project name"),
  projectId: z.string().nullable().optional().describe("Project ID"),
  duration: z.string().describe("Duration (e.g. '8h', '2h 30m', '480m')"),
  date: z.string().nullable().optional().describe("Date (YYYY-MM-DD)"),
  description: z.string().nullable().optional().describe("Description"),
});

/**
 * Parse duration string to seconds using parse-duration library
 * Supports: "8h", "2h", "30m", "480m", "8.5h" (decimal hours), "2h 30m" (compound)
 */
function parseDurationToSeconds(durationStr: string): number {
  const trimmed = durationStr.trim();

  // Handle bare decimal numbers (e.g., "8.5" treated as hours)
  if (/^\d+\.?\d*$/.test(trimmed)) {
    const hours = Number.parseFloat(trimmed);
    if (!Number.isNaN(hours)) {
      return Math.round(hours * 3600);
    }
  }

  // Use parse-duration for all other formats
  const milliseconds = parseDuration(trimmed);
  if (milliseconds === null || milliseconds === undefined) {
    throw new Error(
      `Invalid duration format: ${durationStr}. Use formats like '8h', '2h 30m', '480m', or '8.5h'`,
    );
  }

  return Math.round(milliseconds / 1000);
}

export const createTrackerEntryTool = tool({
  description:
    "Create a time entry for a tracker project - supports finding projects by name and flexible duration formats.",
  inputSchema: createTrackerEntrySchema,
  execute: async function* (
    { projectName, projectId, duration, date, description },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;
    const userId = appContext.userId || null;
    const searchProjectName = projectName;

    if (!teamId) {
      yield {
        text: "Unable to create tracker entry: Team ID not found in context.",
      };
      return;
    }

    try {
      // Find project by name or use provided projectId
      let finalProjectId: string | null = projectId || null;

      if (!finalProjectId && searchProjectName) {
        // Search for project by name
        const projectsResult = await getTrackerProjects(db, {
          teamId,
          q: searchProjectName,
          pageSize: 5,
        });

        if (projectsResult.data.length === 0) {
          yield {
            text: `No project found matching "${searchProjectName}". Please check the project name or provide a project ID.`,
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
            text: `Multiple projects found matching "${searchProjectName}". Using "${projectsResult.data[0].name}". Other matches: ${projectNames}`,
          };
        }
      }

      if (!finalProjectId) {
        yield {
          text: "Please provide either a projectName or projectId to create a time entry.",
        };
        return;
      }

      // Parse duration
      let durationSeconds: number;
      try {
        durationSeconds = parseDurationToSeconds(duration);
      } catch (error) {
        yield {
          text:
            error instanceof Error ? error.message : "Invalid duration format.",
        };
        return;
      }

      // Determine date (default to today)
      const entryDate = date || new Date().toISOString().split("T")[0];
      if (!entryDate) {
        yield {
          text: "Invalid date format.",
        };
        return;
      }

      // Calculate start and stop times (9 AM in user's timezone + duration)
      const userTimezone = appContext.timezone || "UTC";
      let startTime: Date;

      if (userTimezone && userTimezone !== "UTC") {
        try {
          // Create a date at 9 AM in the user's timezone
          const createTZDate = tz(userTimezone);
          const baseDate = createTZDate(new Date(`${entryDate}T00:00:00`));
          startTime = setMinutes(setHours(baseDate, 9), 0);
        } catch (_error) {
          // Fallback to UTC if timezone conversion fails
          startTime = new Date(`${entryDate}T09:00:00.000Z`);
        }
      } else {
        // Use UTC if no timezone provided
        startTime = new Date(`${entryDate}T09:00:00.000Z`);
      }

      const stopTime = new Date(startTime.getTime() + durationSeconds * 1000);

      const startTimeISO = startTime.toISOString();
      const stopTimeISO = stopTime.toISOString();

      // Create the entry
      const result = await upsertTrackerEntries(db, {
        teamId,
        projectId: finalProjectId,
        start: startTimeISO,
        stop: stopTimeISO,
        dates: [entryDate],
        duration: durationSeconds,
        assignedId: userId,
        description: description || null,
      });

      if (!result || result.length === 0) {
        yield {
          text: "Failed to create tracker entry.",
        };
        return;
      }

      const entry = result[0];
      if (!entry) {
        yield {
          text: "Failed to create tracker entry.",
        };
        return;
      }

      const start = new Date(0);
      const end = new Date(durationSeconds * 1000);
      const formattedDuration = formatDistance(start, end, {
        includeSeconds: false,
      });
      const projectName = entry.trackerProject?.name || "Unknown";

      const response = `Successfully created time entry:\n\n**Project:** ${projectName}\n**Date:** ${formatDate(entryDate)}\n**Duration:** ${formattedDuration}\n**Description:** ${entry.description || "None"}`;

      yield {
        text: response,
        link: {
          text: "View tracker",
          url: `${getAppUrl()}/tracker`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to create tracker entry: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
