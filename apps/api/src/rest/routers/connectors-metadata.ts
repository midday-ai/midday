import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { connectorsCache } from "@midday/cache/connectors-cache";
import {
  CURATED_TOOLKIT_SLUGS,
  connectorApps,
  toComposioSlug,
} from "@midday/connectors";

const app = new OpenAPIHono<Context>();

const COMPOSIO_API = "https://backend.composio.dev/api/v3";
const CACHE_KEY = "metadata";
const CACHE_TTL = 86400; // 24h

type ConnectorMetadata = Record<string, { logo: string; description: string }>;

async function fetchFromComposio(): Promise<ConnectorMetadata> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) return {};

  const results = await Promise.allSettled(
    CURATED_TOOLKIT_SLUGS.map(async (slug) => {
      const res = await fetch(`${COMPOSIO_API}/toolkits/${slug}`, {
        headers: { "x-api-key": apiKey },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        slug: string;
        meta?: { logo?: string; description?: string };
      };
      return data.meta?.logo
        ? {
            slug: data.slug,
            logo: data.meta.logo,
            description: data.meta.description ?? "",
          }
        : null;
    }),
  );

  const metadata: ConnectorMetadata = {};

  for (let i = 0; i < connectorApps.length; i++) {
    const connector = connectorApps[i];
    if (!connector) continue;
    const composioSlug = toComposioSlug(connector.id);
    const idx = CURATED_TOOLKIT_SLUGS.indexOf(
      composioSlug as (typeof CURATED_TOOLKIT_SLUGS)[number],
    );
    if (idx === -1) continue;

    const result = results[idx];
    if (result?.status === "fulfilled" && result.value) {
      metadata[connector.id] = {
        logo: result.value.logo,
        description: result.value.description,
      };
    }
  }

  return metadata;
}

app.get("/", async (c) => {
  const metadata = await connectorsCache.getOrSet<ConnectorMetadata>(
    CACHE_KEY,
    CACHE_TTL,
    fetchFromComposio,
  );

  return c.json(metadata, 200, {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
  });
});

export { app as connectorsMetadataRouter };
