import { connectorsCache } from "@midday/cache/connectors-cache";
import {
  CURATED_TOOLKIT_SLUGS,
  connectorApps,
  toComposioSlug,
} from "@midday/connectors";
import { composioFetch } from "./client";

export type CatalogEntry = {
  slug: string;
  name: string;
  logo: string | null;
  description: string | null;
};

const CACHE_KEY = "catalog";
const CACHE_TTL = 86400; // 24h

async function fetchCatalog(): Promise<CatalogEntry[]> {
  const apiKey = process.env.COMPOSIO_API_KEY;

  const composioMeta = new Map<string, { logo: string; description: string }>();

  if (apiKey) {
    const results = await Promise.allSettled(
      CURATED_TOOLKIT_SLUGS.map(async (slug) => {
        const data = await composioFetch<{
          slug: string;
          meta?: { logo?: string; description?: string };
        }>(`/toolkits/${slug}`).catch(() => null);

        if (!data?.meta?.logo) return null;
        return {
          slug: data.slug,
          logo: data.meta.logo,
          description: data.meta.description ?? "",
        };
      }),
    );

    for (let i = 0; i < CURATED_TOOLKIT_SLUGS.length; i++) {
      const result = results[i];
      if (result?.status === "fulfilled" && result.value) {
        composioMeta.set(result.value.slug, {
          logo: result.value.logo,
          description: result.value.description,
        });
      }
    }
  }

  const catalog: CatalogEntry[] = [];

  for (const connector of connectorApps) {
    if (!connector.active) continue;
    const composioSlug = toComposioSlug(connector.id);
    const meta = composioMeta.get(composioSlug);

    catalog.push({
      slug: composioSlug,
      name: connector.name,
      logo: meta?.logo ?? null,
      description: meta?.description ?? connector.short_description ?? null,
    });
  }

  return catalog;
}

export async function getCatalog(): Promise<CatalogEntry[]> {
  return connectorsCache.getOrSet<CatalogEntry[]>(
    CACHE_KEY,
    CACHE_TTL,
    fetchCatalog,
  );
}
