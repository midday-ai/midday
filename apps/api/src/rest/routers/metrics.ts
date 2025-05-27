import {
  getBurnRate,
  getExpenses,
  getMetrics,
  getRunway,
  getSpending,
} from "@api/db/queries/metrics";
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

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/revenue",
    summary: "Revenue metrics",
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
