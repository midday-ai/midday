import { getCustomers } from "@api/db/queries/customers";
import {
  customersResponseSchema,
  getCustomersSchema,
} from "@api/schemas/customers";
import { withTransform } from "@api/utils/with-transform";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono();

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
            schema: resolver(customersResponseSchema.snake),
          },
        },
      },
    },
  }),
  zValidator("query", getCustomersSchema.snake),
  withTransform(
    { input: getCustomersSchema, output: customersResponseSchema },
    async (c, params) => {
      const db = c.get("db");
      const teamId = c.get("teamId");

      return getCustomers(db, { teamId, ...params });
    },
  ),
);

app.post(
  "/",
  describeRoute({
    description: "Create customer",
    tags: ["Customers"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get customer by ID",
    tags: ["Customers"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update customer by ID",
    tags: ["Customers"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete customer by ID",
    tags: ["Customers"],
  }),
);

export const customersRouter = app;
