import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getMerchants } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getMerchantsSchema = z.object({
  cursor: z.string().nullable().optional().describe("Pagination cursor"),
  sort: z
    .array(z.string())
    .length(2)
    .nullable()
    .optional()
    .describe("Sort order"),
  pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
  q: z.string().nullable().optional().describe("Search query"),
  tags: z.array(z.string()).nullable().optional().describe("Tag IDs"),
});

export const getMerchantsTool = tool({
  description:
    "Retrieve and filter merchants with pagination, sorting, and search.",
  inputSchema: getMerchantsSchema,
  execute: async function* (
    { cursor, sort, pageSize = 10, q, tags },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve merchants: Team ID not found in context.",
      };
      return;
    }

    try {
      const params = {
        teamId,
        cursor: cursor ?? null,
        sort: sort ?? null,
        pageSize,
        q: q ?? null,
      };

      const result = await getMerchants(db, params);

      if (result.data.length === 0) {
        yield { text: "No merchants found matching your criteria." };
        return;
      }

      // Filter by tags if provided (since getMerchants doesn't support tags in params)
      let filteredData = result.data;
      if (tags && tags.length > 0) {
        filteredData = result.data.filter((merchant) => {
          const merchantTagIds = merchant.tags?.map((tag) => tag.id) || [];
          return tags.some((tagId: string) => merchantTagIds.includes(tagId));
        });
      }

      if (filteredData.length === 0) {
        yield { text: "No merchants found matching your criteria." };
        return;
      }

      const formattedMerchants = filteredData.map((merchant) => {
        const tagNames =
          merchant.tags?.map((tag) => tag.name).join(", ") || "None";
        return {
          id: merchant.id,
          name: merchant.name,
          email: merchant.email || "N/A",
          contact: merchant.contact || "N/A",
          invoiceCount: merchant.invoiceCount ?? 0,
          projectCount: merchant.projectCount ?? 0,
          tags: tagNames,
          createdAt: formatDate(merchant.createdAt),
        };
      });

      const totalInvoices = filteredData.reduce(
        (sum, m) => sum + (m.invoiceCount ?? 0),
        0,
      );
      const totalProjects = filteredData.reduce(
        (sum, m) => sum + (m.projectCount ?? 0),
        0,
      );

      const response = `| Name | Email | Contact | Invoices | Projects | Tags | Created |\n|------|-------|---------|----------|----------|------|----------|\n${formattedMerchants.map((m) => `| ${m.name} | ${m.email} | ${m.contact} | ${m.invoiceCount} | ${m.projectCount} | ${m.tags} | ${m.createdAt} |`).join("\n")}\n\n**${filteredData.length} merchants** | Total Invoices: ${totalInvoices} | Total Projects: ${totalProjects}`;

      yield {
        text: response,
        link: {
          text: "View all merchants",
          url: `${getAppUrl()}/merchants`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve merchants: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
