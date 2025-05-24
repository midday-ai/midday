import { getUserById, updateUser } from "@api/db/queries/users";
import type { Context } from "@api/rest/types";
import { updateUserSchema, userSchema } from "@api/schemas/users";
import { withTransform } from "@api/utils/with-transform";
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
            schema: resolver(userSchema.snake),
          },
        },
      },
    },
  }),
  withTransform({ output: userSchema }, async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    return getUserById(db, session.user.id);
  }),
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
            schema: resolver(userSchema.snake),
          },
        },
      },
    },
  }),
  zValidator("json", updateUserSchema.snake),
  withTransform(
    {
      input: updateUserSchema,
      output: userSchema,
      inputSource: "json",
    },
    async (c, transformedInput) => {
      const db = c.get("db");
      const session = c.get("session");

      return updateUser(db, {
        id: session.user.id,
        ...transformedInput,
      });
    },
  ),
);

export const usersRouter = app;
