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
import {
  deleteInvoice,
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
  getPaymentStatus,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all invoices",
    operationId: "listInvoices",
    "x-speakeasy-name-override": "list",
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
    middleware: [withRequiredScope("invoices.read")],
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
      ...filter,
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
    middleware: [withRequiredScope("invoices.read")],
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
    operationId: "getInvoiceSummary",
    "x-speakeasy-name-override": "summary",
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
    middleware: [withRequiredScope("invoices.read")],
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
    path: "/{id}",
    summary: "Retrieve a invoice",
    operationId: "getInvoiceById",
    "x-speakeasy-name-override": "get",
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
    middleware: [withRequiredScope("invoices.read")],
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
    path: "/{id}",
    summary: "Delete a invoice",
    operationId: "deleteInvoice",
    "x-speakeasy-name-override": "delete",
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
    middleware: [withRequiredScope("invoices.write")],
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
