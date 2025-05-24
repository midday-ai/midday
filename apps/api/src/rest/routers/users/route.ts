import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { querySchema } from "./schema";
import { responseSchema } from "./schema";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    tags: ["Users"],
    responses: {
      200: {
        description: "Successful greeting response",
        content: {
          "text/plain": {
            schema: resolver(responseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", querySchema),
  (c) => {
    const query = c.req.valid("query");
    return c.text(`Hello ${query?.name ?? "Hono"}!`);
  },
);

app.get(
  "/me",
  describeRoute({
    description: "Get the current user",
    tags: ["Users"],
  }),
);

export const usersRouter = app;
