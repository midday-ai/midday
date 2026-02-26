import { withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  merchantResponseSchema,
  merchantsResponseSchema,
  getMerchantByIdSchema,
  getMerchantsSchema,
  upsertMerchantSchema,
} from "@api/schemas/merchants";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  deleteMerchant,
  getMerchantById,
  getMerchants,
  upsertMerchant,
} from "@midday/db/queries";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all merchants",
    operationId: "listMerchants",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of merchants for the authenticated team.",
    tags: ["Merchants"],
    request: {
      query: getMerchantsSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a list of merchants for the authenticated team.",
        content: {
          "application/json": {
            schema: merchantsResponseSchema,
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

    const result = await getMerchants(db, {
      ...query,
      teamId,
      q,
    });

    return c.json(validateResponse(result, merchantsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create merchant",
    operationId: "createMerchant",
    "x-speakeasy-name-override": "create",
    description: "Create a new merchant for the authenticated team.",
    tags: ["Merchants"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: upsertMerchantSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Merchant created",
        content: {
          "application/json": {
            schema: merchantResponseSchema,
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

    const result = await upsertMerchant(db, {
      ...body,
      teamId,
    });

    return c.json(validateResponse(result, merchantResponseSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a merchant",
    operationId: "getMerchantById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a merchant by ID for the authenticated team.",
    tags: ["Merchants"],
    request: {
      params: getMerchantByIdSchema,
    },
    responses: {
      200: {
        description:
          "Retrieve a merchant by ID for the authenticated team.",
        content: {
          "application/json": {
            schema: merchantResponseSchema,
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

    const result = await getMerchantById(db, { id, teamId });

    return c.json(validateResponse(result, merchantResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a merchant",
    operationId: "updateMerchant",
    "x-speakeasy-name-override": "update",
    description: "Update a merchant by ID for the authenticated team.",
    tags: ["Merchants"],
    request: {
      params: getMerchantByIdSchema,
      body: {
        content: {
          "application/json": {
            schema: upsertMerchantSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Merchant updated",
        content: {
          "application/json": {
            schema: merchantResponseSchema,
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

    const result = await upsertMerchant(db, {
      ...body,
      id,
      teamId,
    });

    return c.json(validateResponse(result, merchantResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a merchant",
    operationId: "deleteMerchant",
    "x-speakeasy-name-override": "delete",
    description: "Delete a merchant by ID for the authenticated team.",
    tags: ["Merchants"],
    request: {
      params: getMerchantByIdSchema,
    },
    responses: {
      200: {
        description: "Merchant deleted",
        content: {
          "application/json": {
            schema: merchantResponseSchema,
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

    const result = await deleteMerchant(db, { id, teamId });

    return c.json(validateResponse(result, merchantResponseSchema));
  },
);

export const merchantsRouter = app;
