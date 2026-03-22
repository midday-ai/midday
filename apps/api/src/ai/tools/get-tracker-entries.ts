import type { AppContext } from "@api/ai/context";
import { db } from "@midday/db/client";
import { getTrackerRecordsByRange } from "@midday/db/queries";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { formatDistance } from "date-fns";
import { z } from "zod";

const getTrackerEntriesSchema = z.object({
  from: z.string().describe("Start date (ISO 8601)"),
  to: z.string().describe("End date (ISO 8601)"),
  projectId: z.string().nullable().optional().describe("Project ID"),
  userId: z.string().nullable().optional().describe("User ID"),
});

export const getTrackerEntriesTool = tool({
  description:
    "Retrieve tracker entries (time entries) within a date range with filtering by project or user.",
  inputSchema: getTrackerEntriesSchema,
  execute: async function* ({ from, to, projectId, userId }, executionOptions) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve tracker entries: Team ID not found in context.",
      };
      return;
    }

    try {
      const params = {
        teamId,
        from,
        to,
        projectId: projectId ?? undefined,
        userId: userId ?? undefined,
      };

      const result = await getTrackerRecordsByRange(db, params);

      // Flatten the grouped entries
      const allEntries = Object.values(result.result).flat();

      if (allEntries.length === 0) {
        yield { text: "No tracker entries found matching your criteria." };
        return { entries: [], total: 0, totalDuration: 0 };
      }

      const formattedEntries = allEntries.map((entry) => {
        const start = new Date(0);
        const end = new Date((entry.duration ?? 0) * 1000);
        const formattedDuration = formatDistance(start, end, {
          includeSeconds: false,
        });
        const projectName = entry.trackerProject?.name || "No project";
        const assignedName = entry.user?.fullName || "Unassigned";
        const description = entry.description || "No description";

        return {
          id: entry.id,
          date: formatDate(entry.date || ""),
          projectName,
          duration: formattedDuration,
          durationSeconds: entry.duration ?? 0,
          description,
          assignedName,
        };
      });

      yield { text: `${allEntries.length} time entries found` };

      return {
        entries: formattedEntries,
        total: allEntries.length,
        totalDuration: result.meta.totalDuration,
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve tracker entries: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
