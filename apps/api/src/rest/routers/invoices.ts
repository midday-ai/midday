import {
  deleteInvoice,
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
  getPaymentStatus,
} from "@api/db/queries/invoices";
import type { Context } from "@api/rest/types";
import {
  deleteInvoiceResponseSchema,
  deleteInvoiceSchema,
  getInvoiceByIdSchema,
  getInvoicesSchema,
  getPaymentStatusResponseSchema,
  invoiceResponseSchema,
  invoiceSummaryResponseSchema,
  invoiceSummarySchema,
  invoicesResponseSchema,
} from "@api/schemas/invoice";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all invoices",
    description: "Retrieve a list of invoices for the authenticated team.",
    tags: ["Invoices"],
    request: {
      query: getInvoicesSchema,
    },
    responses: {
      200: {
        description: "A list of invoices for the authenticated team.",
        content: {
          "application/json": {
            schema: invoicesResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { pageSize, cursor, sort, ...filter } = c.req.valid("query");

    const result = await getInvoices(db, {
      teamId,
      pageSize,
      cursor,
      sort,
      filter,
    });

    return c.json(validateResponse(result, invoicesResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/payment-status",
    summary: "Payment status",
    description: "Get payment status for the authenticated team.",
    tags: ["Invoices"],
    responses: {
      200: {
        description: "Payment status for the authenticated team.",
        content: {
          "application/json": {
            schema: getPaymentStatusResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const result = await getPaymentStatus(db, teamId);

    return c.json(validateResponse(result, getPaymentStatusResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/summary",
    summary: "Invoice summary",
    description: "Get summary of invoices for the authenticated team.",
    tags: ["Invoices"],
    request: {
      query: invoiceSummarySchema,
    },
    responses: {
      200: {
        description: "Summary of invoices for the authenticated team.",
        content: {
          "application/json": {
            schema: invoiceSummaryResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { status } = c.req.valid("query");

    const result = await getInvoiceSummary(db, {
      teamId,
      status,
    });

    return c.json(validateResponse(result, invoiceSummaryResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/:id",
    summary: "Retrieve a invoice",
    description:
      "Retrieve a invoice by its unique identifier for the authenticated team.",
    tags: ["Invoices"],
    request: {
      params: getInvoiceByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description:
          "Retrieve a invoice by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: invoiceResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getInvoiceById(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, invoiceResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/:id",
    summary: "Delete a invoice",
    description:
      "Delete an invoice by its unique identifier for the authenticated team. Only invoices with status 'draft' or 'canceled' can be deleted directly. If the invoice is not in one of these statuses, update its status to 'canceled' before attempting deletion.",
    tags: ["Invoices"],
    request: {
      params: deleteInvoiceSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description:
          "Delete a invoice by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: deleteInvoiceResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await deleteInvoice(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, deleteInvoiceResponseSchema));
  },
);

export const invoicesRouter = app;
