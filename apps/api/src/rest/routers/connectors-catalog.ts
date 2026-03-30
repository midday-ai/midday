import { getCatalog } from "@api/composio/catalog";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

app.get("/", async (c) => {
  const catalog = await getCatalog();

  return c.json(catalog, 200, {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
  });
});

export { app as connectorsCatalogRouter };
