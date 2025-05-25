import { getUserById, updateUser } from "@api/db/queries/users";
import type { Context } from "@api/rest/types";
import { updateUserSchema, userSchema } from "@api/schemas/users";
import { withSanitized } from "@api/utils/with-sanitized";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono<Context>();

app.get(
  "/me",
  describeRoute({
    description: "Get the current user",
    tags: ["Users"],
    responses: {
      200: {
        description: "The current user",
        content: {
          "application/json": {
            schema: resolver(userSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    const result = await getUserById(db, session.user.id);

    return c.json(withSanitized(userSchema, result));
  },
);

app.put(
  "/me",
  describeRoute({
    description: "Update the current user",
    tags: ["Users"],
    responses: {
      200: {
        description: "The updated user",
        content: {
          "application/json": {
            schema: resolver(userSchema),
          },
        },
      },
    },
  }),
  zValidator("json", updateUserSchema),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const body = c.req.valid("json");

    const result = await updateUser(db, {
      id: session.user.id,
      ...body,
    });

    return c.json(withSanitized(userSchema, result));
  },
);

export const usersRouter = app;
