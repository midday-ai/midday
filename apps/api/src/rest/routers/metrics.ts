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
} from "@api/schemas/metrics";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  getBurnRate,
  getExpenses,
  getMetrics,
  getRunway,
  getSpending,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/revenue",
    summary: "Revenue metrics",
    operationId: "getRevenueMetrics",
    "x-speakeasy-name-override": "revenue",
    description: "Revenue metrics for the authenticated team.",
    tags: ["Metrics"],
    request: {
      query: getRevenueSchema,
    },
    responses: {
      200: {
        description: "Revenue metrics for the authenticated team.",
        content: {
          "application/json": {
            schema: getRevenueResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("metrics.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency } = c.req.valid("query");

    const results = await getMetrics(db, {
      teamId,
      from,
      to,
      currency,
      type: "revenue",
    });

    return c.json(validateResponse(results, getRevenueResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/profit",
    summary: "Profit metrics",
    operationId: "getProfitMetrics",
    "x-speakeasy-name-override": "profit",
    description: "Profit metrics for the authenticated team.",
    tags: ["Metrics"],
    request: {
      query: getProfitSchema,
    },
    responses: {
      200: {
        description: "Profit metrics for the authenticated team.",
        content: {
          "application/json": {
            schema: getProfitResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("metrics.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency } = c.req.valid("query");

    const results = await getMetrics(db, {
      teamId,
      from,
      to,
      currency,
      type: "profit",
    });

    return c.json(validateResponse(results, getProfitResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/burn-rate",
    summary: "Burn rate metrics",
    operationId: "getBurnRateMetrics",
    "x-speakeasy-name-override": "burn-rate",
    description: "Burn rate metrics for the authenticated team.",
    tags: ["Metrics"],
    request: {
      query: getBurnRateSchema,
    },
    responses: {
      200: {
        description: "Burn rate metrics for the authenticated team.",
        content: {
          "application/json": {
            schema: getBurnRateResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("metrics.read")],
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
    summary: "Runway metrics",
    operationId: "getRunwayMetrics",
    "x-speakeasy-name-override": "runway",
    description: "Runway metrics for the authenticated team.",
    tags: ["Metrics"],
    request: {
      query: getRunwaySchema,
    },
    responses: {
      200: {
        description: "Runway metrics for the authenticated team.",
        content: {
          "application/json": {
            schema: getRunwayResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("metrics.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { from, to, currency } = c.req.valid("query");

    const results = await getRunway(db, {
      teamId,
      from,
      to,
      currency,
    });

    return c.json(validateResponse(results, getRunwayResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/expenses",
    summary: "Expense metrics",
    operationId: "getExpensesMetrics",
    "x-speakeasy-name-override": "expenses",
    description: "Expense metrics for the authenticated team.",
    tags: ["Metrics"],
    request: {
      query: getExpensesSchema,
    },
    responses: {
      200: {
        description: "Expense metrics for the authenticated team.",
        content: {
          "application/json": {
            schema: getExpensesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("metrics.read")],
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
    summary: "Spending metrics",
    operationId: "getSpendingMetrics",
    "x-speakeasy-name-override": "spending",
    description: "Spending metrics for the authenticated team.",
    tags: ["Metrics"],
    request: {
      query: getSpendingSchema,
    },
    responses: {
      200: {
        description: "Spending metrics for the authenticated team.",
        content: {
          "application/json": {
            schema: getSpendingResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("metrics.read")],
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

export const metricsRouter = app;
