import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getDocuments } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getDocumentsSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Pagination cursor from the previous page. Use the cursor value returned from a previous request to get the next page. Leave empty for first page.",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Number of documents to return per page. Minimum 1, maximum 100. Default is 10. Use smaller values (10-25) for quick overviews, larger (50-100) for comprehensive lists.",
    ),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string. Searches across document names, titles, and content. Example: 'invoice' or 'receipt'",
    ),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by tag IDs. Provide array of tag UUIDs. Example: ['tag-uuid-1', 'tag-uuid-2']",
    ),
  start: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Start date for date range filter (inclusive). Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-01-01' or '2024-01-01T00:00:00.000Z'",
    ),
  end: z
    .string()
    .nullable()
    .optional()
    .describe(
      "End date for date range filter (inclusive). Use ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'. Example: '2024-12-31' or '2024-12-31T23:59:59.999Z'",
    ),
});

export const getDocumentsTool = tool({
  description:
    "Retrieve and filter documents with pagination, sorting, and search capabilities. Use this tool when users ask about documents, want to see document lists, search for specific documents, or need document data for analysis.",
  inputSchema: getDocumentsSchema,
  execute: async function* (
    { cursor, pageSize = 10, q, tags, start, end },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve documents: Team ID not found in context.",
      };
      return;
    }

    try {
      const params = {
        teamId,
        cursor: cursor ?? null,
        pageSize,
        q: q ?? null,
        tags: tags ?? null,
        start: start ?? null,
        end: end ?? null,
      };

      const result = await getDocuments(db, params);

      if (result.data.length === 0) {
        yield { text: "No documents found matching your criteria." };
        return;
      }

      const formattedDocuments = result.data.map((document) => {
        const tagNames =
          document.documentTagAssignments
            ?.map((dta) => dta.documentTag?.name)
            .filter((name): name is string => Boolean(name))
            .join(", ") || "None";

        return {
          id: document.id,
          name: document.name?.split("/").pop() || "Untitled",
          title:
            document.title || document.name?.split("/").pop() || "Untitled",
          date: document.date ? formatDate(document.date) : "N/A",
          tags: tagNames,
          status: document.processingStatus || "unknown",
        };
      });

      const response = `| Name | Title | Date | Tags | Status |\n|------|-------|------|------|--------|\n${formattedDocuments.map((doc) => `| ${doc.name} | ${doc.title} | ${doc.date} | ${doc.tags} | ${doc.status} |`).join("\n")}\n\n**${result.data.length} documents**`;

      yield {
        text: response,
        link: {
          text: "View all documents",
          url: `${getAppUrl()}/vault`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve documents: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
