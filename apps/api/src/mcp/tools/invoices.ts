import {
  getInvoiceByIdSchema,
  getInvoicesSchema,
  invoiceSummarySchema,
} from "@api/schemas/invoice";
import {
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
} from "@midday/db/queries";
import { READ_ONLY_ANNOTATIONS, type RegisterTools, hasScope } from "../types";

export const registerInvoiceTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Require invoices.read scope
  if (!hasScope(ctx, "invoices.read")) {
    return;
  }
  server.registerTool(
    "invoices_list",
    {
      title: "List Invoices",
      description:
        "List invoices with filtering by status, customer, date range, and search. Use this to find invoices.",
      inputSchema: getInvoicesSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getInvoices(db, {
        teamId,
        cursor: params.cursor ?? null,
        pageSize: params.pageSize ?? 25,
        q: params.q ?? null,
        start: params.start ?? null,
        end: params.end ?? null,
        statuses: params.statuses ?? null,
        customers: params.customers ?? null,
        sort: params.sort ?? null,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "invoices_get",
    {
      title: "Get Invoice",
      description: "Get a specific invoice by its ID with full details",
      inputSchema: {
        id: getInvoiceByIdSchema.shape.id,
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id }) => {
      const result = await getInvoiceById(db, { id, teamId });

      if (!result) {
        return {
          content: [{ type: "text", text: "Invoice not found" }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "invoices_summary",
    {
      title: "Invoice Summary",
      description:
        "Get a summary of invoices including total amounts and counts by status",
      inputSchema: invoiceSummarySchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params) => {
      const result = await getInvoiceSummary(db, {
        teamId,
        statuses: params.statuses,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
