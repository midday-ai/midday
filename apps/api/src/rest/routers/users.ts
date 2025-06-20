import type { Context } from "@api/rest/types";
import { updateUserSchema, userSchema } from "@api/schemas/users";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { getUserById, updateUser } from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/me",
    summary: "Retrieve the current user",
    operationId: "getCurrentUser",
    "x-speakeasy-name-override": "get",
    description: "Retrieve the current user for the authenticated team.",
    tags: ["Users"],
    responses: {
      200: {
        description: "Retrieve the current user for the authenticated team.",
        content: {
          "application/json": {
            schema: userSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("users.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    const result = await getUserById(db, session.user.id);

    return c.json(validateResponse(result, userSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/me",
    summary: "Update the current user",
    operationId: "updateCurrentUser",
    "x-speakeasy-name-override": "update",
    description: "Update the current user for the authenticated team.",
    tags: ["Users"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateUserSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "The updated user",
        content: {
          "application/json": {
            schema: userSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("users.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const body = c.req.valid("json");

    const result = await updateUser(db, {
      id: session.user.id,
      ...body,
    });

    return c.json(validateResponse(result, userSchema));
  },
);

export const usersRouter = app;
