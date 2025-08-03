import { withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  customerResponseSchema,
  customersResponseSchema,
  getCustomerByIdSchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  deleteCustomer,
  getCustomerById,
  getCustomers,
  upsertCustomer,
} from "@midday/db/queries";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all customers",
    operationId: "listCustomers",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of customers for the authenticated team.",
    tags: ["Customers"],
    request: {
      query: getCustomersSchema,
    },
    responses: {
      200: {
        description: "Retrieve a list of customers for the authenticated team.",
        content: {
          "application/json": {
            schema: customersResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("customers.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { q, ...query } = c.req.valid("query");

    const result = await getCustomers(db, {
      ...query,
      teamId,
      q,
    });

    return c.json(validateResponse(result, customersResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create customer",
    operationId: "createCustomer",
    "x-speakeasy-name-override": "create",
    description: "Create a new customer for the authenticated team.",
    tags: ["Customers"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: upsertCustomerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Customer created",
        content: {
          "application/json": {
            schema: customerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("customers.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const body = c.req.valid("json");

    const result = await upsertCustomer(db, {
      ...body,
      teamId,
    });

    return c.json(validateResponse(result, customerResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a customer",
    operationId: "getCustomerById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a customer by ID for the authenticated team.",
    tags: ["Customers"],
    request: {
      params: getCustomerByIdSchema,
    },
    responses: {
      200: {
        description: "Retrieve a customer by ID for the authenticated team.",
        content: {
          "application/json": {
            schema: customerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("customers.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await getCustomerById(db, { id, teamId });

    return c.json(validateResponse(result, customerResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a customer",
    operationId: "updateCustomer",
    "x-speakeasy-name-override": "update",
    description: "Update a customer by ID for the authenticated team.",
    tags: ["Customers"],
    request: {
      params: getCustomerByIdSchema,
      body: {
        content: {
          "application/json": {
            schema: upsertCustomerSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Customer updated",
        content: {
          "application/json": {
            schema: customerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("customers.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;
    const body = c.req.valid("json");

    const result = await upsertCustomer(db, {
      ...body,
      id,
      teamId,
    });

    return c.json(validateResponse(result, customerResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a customer",
    operationId: "deleteCustomer",
    "x-speakeasy-name-override": "delete",
    description: "Delete a customer by ID for the authenticated team.",
    tags: ["Customers"],
    request: {
      params: getCustomerByIdSchema,
    },
    responses: {
      200: {
        description: "Customer deleted",
        content: {
          "application/json": {
            schema: customerResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("customers.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await deleteCustomer(db, { id, teamId });

    return c.json(validateResponse(result, customerResponseSchema));
  },
);

export const customersRouter = app;
