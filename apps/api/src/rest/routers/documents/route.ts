import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { querySchema, responseSchema } from "./schema";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    tags: ["Documents"],
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

app.post(
  "/",
  describeRoute({
    description: "Upload new document",
    tags: ["Documents"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get a document by ID",
    tags: ["Documents"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update a document by ID",
    tags: ["Documents"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete a document by ID",
    tags: ["Documents"],
  }),
);

export const documentsRouter = app;
