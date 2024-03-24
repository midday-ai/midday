import { ErrorSchema } from "@/common/schema";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { AccountsParamsSchema, AccountsSchema } from "./schema";

const app = new OpenAPIHono();

const indexRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: AccountsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AccountsSchema,
        },
      },
      description: "Retrieve accounts",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(indexRoute, (c) => {
  return c.json(
    {
      data: [],
    },
    200
  );
});

export default app;
