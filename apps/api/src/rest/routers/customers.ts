import {
  getCustomerById,
  getCustomers,
  upsertCustomer,
} from "@api/db/queries/customers";
import type { Context } from "@api/rest/types";
import {
  customerResponseSchema,
  customersResponseSchema,
  getCustomerByIdSchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import { requestBodyResolver } from "@api/utils/request-body-resolver";
import { withSanitized } from "@api/utils/with-sanitized";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono<Context>();

app.get(
  "/",
  describeRoute({
    description: "Get customers",
    tags: ["Customers"],
    responses: {
      200: {
        description: "Customers",
        content: {
          "application/json": {
            schema: resolver(customersResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", getCustomersSchema),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const query = c.req.valid("query");

    const data = await getCustomers(db, { teamId, ...query });

    return c.json(withSanitized(customersResponseSchema, { data }));
  },
);

app.post(
  "/",
  describeRoute({
    description: "Create customer",
    tags: ["Customers"],
    requestBody: {
      content: {
        "application/json": {
          schema: requestBodyResolver(upsertCustomerSchema),
        },
      },
    },
    responses: {
      201: {
        description: "Customer",
        content: {
          "application/json": {
            schema: resolver(customerResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("json", upsertCustomerSchema),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const body = c.req.valid("json");

    const result = await upsertCustomer(db, {
      ...body,
      teamId,
    });

    return c.json(withSanitized(customerResponseSchema, result));
  },
);

app.get(
  "/:id",
  describeRoute({
    description: "Get customer by ID",
    tags: ["Customers"],
    responses: {
      200: {
        description: "Customer",
        content: {
          "application/json": {
            schema: resolver(customerResponseSchema),
          },
        },
      },
    },
  }),
  // withRequiredScopes(["customers:read"]),
  zValidator("param", getCustomerByIdSchema),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await getCustomerById(db, { id, teamId });

    return c.json(withSanitized(customerResponseSchema, result));
  },
);

app.put(
  "/:id",
  describeRoute({
    description: "Update customer by ID",
    tags: ["Customers"],
    responses: {
      200: {
        description: "Customer",
        content: {
          "application/json": {
            schema: resolver(customerResponseSchema),
          },
        },
      },
    },
    requestBody: {
      content: {
        "application/json": {
          schema: requestBodyResolver(upsertCustomerSchema),
        },
      },
    },
  }),
  zValidator("param", getCustomerByIdSchema),
  zValidator("json", upsertCustomerSchema),
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

    return c.json(withSanitized(customerResponseSchema, result));
  },
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete customer by ID",
    tags: ["Customers"],
  }),
);

export const customersRouter = app;
