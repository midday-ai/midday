import type { AppContext } from "@api/ai/agents/config/shared";
import { db } from "@midday/db/client";
import { getCustomers } from "@midday/db/queries";
import { getAppUrl } from "@midday/utils/envs";
import { formatDate } from "@midday/utils/format";
import { tool } from "ai";
import { z } from "zod";

const getCustomersSchema = z.object({
  cursor: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Pagination cursor from the previous page. Use the cursor value returned from a previous request to get the next page. Leave empty for first page.",
    ),
  sort: z
    .array(z.string())
    .length(2)
    .nullable()
    .optional()
    .describe(
      "Sort order as [field, direction]. Field can be 'name', 'created_at', 'contact', 'email', 'invoices', 'projects', or 'tags'. Direction is 'asc' or 'desc'. Examples: ['name', 'asc'], ['created_at', 'desc']",
    ),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe(
      "Number of customers to return per page. Minimum 1, maximum 100. Default is 10. Use smaller values (10-25) for quick overviews, larger (50-100) for comprehensive lists.",
    ),
  q: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Search query string. Searches across customer names, emails, and contact information. Example: 'Acme Corporation' or 'john@example.com'",
    ),
  tags: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by tag IDs. Provide array of tag UUIDs. Note: This filters after querying, so results may be fewer than pageSize. Example: ['tag-uuid-1', 'tag-uuid-2']",
    ),
});

export const getCustomersTool = tool({
  description:
    "Retrieve and filter customers with pagination, sorting, and search capabilities. Use this tool when users ask about customers, want to see customer lists, search for specific customers, or need customer data for analysis.",
  inputSchema: getCustomersSchema,
  execute: async function* (
    { cursor, sort, pageSize = 10, q, tags },
    executionOptions,
  ) {
    const appContext = executionOptions.experimental_context as AppContext;
    const teamId = appContext.teamId as string;

    if (!teamId) {
      yield {
        text: "Unable to retrieve customers: Team ID not found in context.",
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

      const result = await getCustomers(db, params);

      if (result.data.length === 0) {
        yield { text: "No customers found matching your criteria." };
        return;
      }

      // Filter by tags if provided (since getCustomers doesn't support tags in params)
      let filteredData = result.data;
      if (tags && tags.length > 0) {
        filteredData = result.data.filter((customer) => {
          const customerTagIds = customer.tags?.map((tag) => tag.id) || [];
          return tags.some((tagId: string) => customerTagIds.includes(tagId));
        });
      }

      if (filteredData.length === 0) {
        yield { text: "No customers found matching your criteria." };
        return;
      }

      const formattedCustomers = filteredData.map((customer) => {
        const tagNames =
          customer.tags?.map((tag) => tag.name).join(", ") || "None";
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email || "N/A",
          contact: customer.contact || "N/A",
          invoiceCount: customer.invoiceCount ?? 0,
          projectCount: customer.projectCount ?? 0,
          tags: tagNames,
          createdAt: formatDate(customer.createdAt),
        };
      });

      const totalInvoices = filteredData.reduce(
        (sum, cust) => sum + (cust.invoiceCount ?? 0),
        0,
      );
      const totalProjects = filteredData.reduce(
        (sum, cust) => sum + (cust.projectCount ?? 0),
        0,
      );

      const response = `| Name | Email | Contact | Invoices | Projects | Tags | Created |\n|------|-------|---------|----------|----------|------|----------|\n${formattedCustomers.map((cust) => `| ${cust.name} | ${cust.email} | ${cust.contact} | ${cust.invoiceCount} | ${cust.projectCount} | ${cust.tags} | ${cust.createdAt} |`).join("\n")}\n\n**${filteredData.length} customers** | Total Invoices: ${totalInvoices} | Total Projects: ${totalProjects}`;

      yield {
        text: response,
        link: {
          text: "View all customers",
          url: `${getAppUrl()}/customers`,
        },
      };
    } catch (error) {
      yield {
        text: `Failed to retrieve customers: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
