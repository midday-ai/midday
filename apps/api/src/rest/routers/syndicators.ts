import { withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  getSyndicatorByIdSchema,
  getSyndicatorsSchema,
  upsertSyndicatorSchema,
  deleteSyndicatorSchema,
  getSyndicatorDealsSchema,
} from "@api/schemas/syndication";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  deleteSyndicator,
  getSyndicatorById,
  getSyndicators,
  getSyndicatorDeals,
  upsertSyndicator,
} from "@midday/db/queries";
import { z } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

const syndicatorResponseSchema = z.object({}).passthrough();
const syndicatorsResponseSchema = z.object({}).passthrough();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all syndicators",
    operationId: "listSyndicators",
    "x-speakeasy-name-override": "list",
    description:
      "Retrieve a list of syndicators for the authenticated team.",
    tags: ["Syndicators"],
    request: {
      query: getSyndicatorsSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a list of syndicators for the authenticated team.",
        content: {
          "application/json": {
            schema: syndicatorsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("merchants.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { q, ...query } = c.req.valid("query");

    const result = await getSyndicators(db, {
      ...query,
      teamId,
      q,
    });

    return c.json(result as any);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create syndicator",
    operationId: "createSyndicator",
    "x-speakeasy-name-override": "create",
    description: "Create a new syndicator for the authenticated team.",
    tags: ["Syndicators"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: upsertSyndicatorSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Syndicator created",
        content: {
          "application/json": {
            schema: syndicatorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("merchants.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const body = c.req.valid("json");

    const result = await upsertSyndicator(db, {
      ...body,
      teamId,
    });

    return c.json(result as any, 201);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a syndicator",
    operationId: "getSyndicatorById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a syndicator by ID for the authenticated team.",
    tags: ["Syndicators"],
    request: {
      params: getSyndicatorByIdSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a syndicator by ID for the authenticated team.",
        content: {
          "application/json": {
            schema: syndicatorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("merchants.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await getSyndicatorById(db, { id, teamId });

    return c.json(result as any);
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a syndicator",
    operationId: "updateSyndicator",
    "x-speakeasy-name-override": "update",
    description: "Update a syndicator by ID for the authenticated team.",
    tags: ["Syndicators"],
    request: {
      params: getSyndicatorByIdSchema,
      body: {
        content: {
          "application/json": {
            schema: upsertSyndicatorSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Syndicator updated",
        content: {
          "application/json": {
            schema: syndicatorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("merchants.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;
    const body = c.req.valid("json");

    const result = await upsertSyndicator(db, {
      ...body,
      id,
      teamId,
    });

    return c.json(result as any);
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a syndicator",
    operationId: "deleteSyndicator",
    "x-speakeasy-name-override": "delete",
    description: "Delete a syndicator by ID for the authenticated team.",
    tags: ["Syndicators"],
    request: {
      params: getSyndicatorByIdSchema,
    },
    responses: {
      200: {
        description: "Syndicator deleted",
        content: {
          "application/json": {
            schema: syndicatorResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("merchants.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await deleteSyndicator(db, { id, teamId });

    return c.json(result as any);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/deals",
    summary: "Get syndicator deals",
    operationId: "getSyndicatorDeals",
    "x-speakeasy-name-override": "getDeals",
    description:
      "Get all deals a syndicator participates in with proportional metrics.",
    tags: ["Syndicators"],
    request: {
      params: getSyndicatorByIdSchema,
    },
    responses: {
      200: {
        description: "Syndicator deals with proportional metrics",
        content: {
          "application/json": {
            schema: z.array(z.object({}).passthrough()),
          },
        },
      },
    },
    middleware: [withRequiredScope("merchants.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await getSyndicatorDeals(db, {
      syndicatorId: id,
      teamId,
    });

    return c.json(result as any);
  },
);

export const syndicatorsRouter = app;
