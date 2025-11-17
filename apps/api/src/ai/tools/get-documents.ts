import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getDocuments } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getDocumentsSchema = z.object({
  cursor: z.string().nullable().optional().describe("Pagination cursor"),
  pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
  q: z.string().nullable().optional().describe("Search query"),
  tags: z.array(z.string()).nullable().optional().describe("Tag IDs"),
  start: z.string().nullable().optional().describe("Start date (ISO 8601)"),
  end: z.string().nullable().optional().describe("End date (ISO 8601)"),
});

export const getDocumentsTool = tool({
  description:
    "Retrieve and filter documents with pagination, sorting, and search.",
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
