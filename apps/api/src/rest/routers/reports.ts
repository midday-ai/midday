import type { Context } from "@api/rest/types";
import {
  getBurnRateResponseSchema,
  getBurnRateSchema,
  getExpensesResponseSchema,
  getExpensesSchema,
  getProfitResponseSchema,
  getProfitSchema,
  getRevenueResponseSchema,
  getRevenueSchema,
  getRunwayResponseSchema,
  getRunwaySchema,
  getSpendingResponseSchema,
  getSpendingSchema,
} from "@api/schemas/reports";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  getBurnRate,
  getExpenses,
  getReports,
  getRunway,
  getSpending,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/revenue",
    summary: "Revenue reports",
    operationId: "getRevenueReports",
    "x-speakeasy-name-override": "revenue",
    description: "Revenue reports for the authenticated team.",
    tags: ["Reports"],
    request: {
      query: getRevenueSchema,
    },
    responses: {
      200: {
        description: "Revenue reports for the authenticated team.",
        content: {
          "application/json": {
            schema: getRevenueResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("reports.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency, revenueType } = c.req.valid("query");

    const results = await getReports(db, {
      teamId,
      from,
      to,
      currency,
      type: "revenue",
      revenueType,
    });

    return c.json(validateResponse(results, getRevenueResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/profit",
    summary: "Profit reports",
    operationId: "getProfitReports",
    "x-speakeasy-name-override": "profit",
    description: "Profit reports for the authenticated team.",
    tags: ["Reports"],
    request: {
      query: getProfitSchema,
    },
    responses: {
      200: {
        description: "Profit reports for the authenticated team.",
        content: {
          "application/json": {
            schema: getProfitResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("reports.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency, revenueType } = c.req.valid("query");

    const results = await getReports(db, {
      teamId,
      from,
      to,
      currency,
      type: "profit",
      revenueType,
    });

    return c.json(validateResponse(results, getProfitResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/burn-rate",
    summary: "Burn rate reports",
    operationId: "getBurnRateReports",
    "x-speakeasy-name-override": "burn-rate",
    description: "Burn rate reports for the authenticated team.",
    tags: ["Reports"],
    request: {
      query: getBurnRateSchema,
    },
    responses: {
      200: {
        description: "Burn rate reports for the authenticated team.",
        content: {
          "application/json": {
            schema: getBurnRateResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("reports.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency } = c.req.valid("query");

    const results = await getBurnRate(db, {
      teamId,
      from,
      to,
      currency,
    });

    return c.json(validateResponse(results, getBurnRateResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/runway",
    summary: "Runway reports",
    operationId: "getRunwayReports",
    "x-speakeasy-name-override": "runway",
    description: "Runway reports for the authenticated team.",
    tags: ["Reports"],
    request: {
      query: getRunwaySchema,
    },
    responses: {
      200: {
        description: "Runway reports for the authenticated team.",
        content: {
          "application/json": {
            schema: getRunwayResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("reports.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { currency } = c.req.valid("query");

    const results = await getRunway(db, {
      teamId,
      currency,
    });

    return c.json(validateResponse(results, getRunwayResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/expenses",
    summary: "Expense reports",
    operationId: "getExpensesReports",
    "x-speakeasy-name-override": "expenses",
    description: "Expense reports for the authenticated team.",
    tags: ["Reports"],
    request: {
      query: getExpensesSchema,
    },
    responses: {
      200: {
        description: "Expense reports for the authenticated team.",
        content: {
          "application/json": {
            schema: getExpensesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("reports.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency } = c.req.valid("query");

    const results = await getExpenses(db, {
      teamId,
      from,
      to,
      currency,
    });

    return c.json(validateResponse(results, getExpensesResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/spending",
    summary: "Spending reports",
    operationId: "getSpendingReports",
    "x-speakeasy-name-override": "spending",
    description: "Spending reports for the authenticated team.",
    tags: ["Reports"],
    request: {
      query: getSpendingSchema,
    },
    responses: {
      200: {
        description: "Spending reports for the authenticated team.",
        content: {
          "application/json": {
            schema: getSpendingResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("reports.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency } = c.req.valid("query");

    const results = await getSpending(db, {
      teamId,
      from,
      to,
      currency,
    });

    return c.json(validateResponse(results, getSpendingResponseSchema));
  },
);

export const reportsRouter = app;
