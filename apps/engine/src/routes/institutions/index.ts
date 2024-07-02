import { ErrorSchema } from "@/common/schema";
import { app } from "@/index";
import { createRoute } from "@hono/zod-openapi";
import { SearchSchema } from "./schema";

const indexRoute = createRoute({
  method: "get",
  path: "/search",
  summary: "Search Institutions",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SearchSchema,
        },
      },
      description: "Search insitutions",
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

app.openapi(indexRoute, async (c) => {
  return c.json(
    {
      data: [],
    },
    200,
  );
});

export default app;
