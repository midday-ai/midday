import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { connectorsCache } from "@midday/cache/connectors-cache";
import { CURATED_TOOLKIT_SLUGS } from "@midday/connectors";
import { logger } from "@midday/logger";
import { LRUCache } from "lru-cache";

export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

const COMPOSIO_API_BASE = "https://backend.composio.dev/api/v3";

export async function composioFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${COMPOSIO_API_BASE}${path}`, {
    headers: { "x-api-key": process.env.COMPOSIO_API_KEY! },
  });
  if (!res.ok) {
    throw new Error(`Composio API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Toolkit item shape returned by session.toolkits()
// ---------------------------------------------------------------------------

export interface ToolkitItem {
  slug: string;
  name: string;
  logo?: string;
  description?: string;
  isNoAuth?: boolean;
  connection?: {
    isActive?: boolean;
    connectedAccount?: { id?: string };
  };
}

function asToolkitItems(items: unknown[]): ToolkitItem[] {
  return items as ToolkitItem[];
}

// ---------------------------------------------------------------------------
// Helpers used by TRPC routes
// ---------------------------------------------------------------------------

const TOOLKIT_CACHE_TTL = 120; // 2 min in seconds

export async function getUserToolkits(userId: string): Promise<ToolkitItem[]> {
  return connectorsCache.getOrSet<ToolkitItem[]>(
    `toolkits:${userId}`,
    TOOLKIT_CACHE_TTL,
    async () => {
      const session = await composio.create(userId);
      const { items } = await session.toolkits({
        toolkits: [...CURATED_TOOLKIT_SLUGS],
        limit: 50,
      });
      return asToolkitItems(items);
    },
  );
}

export async function invalidateUserToolkitsCache(
  userId: string,
): Promise<void> {
  await connectorsCache.delete(`toolkits:${userId}`);
  toolsCache.delete(userId);
}

export function extractActiveConnections(toolkits: ToolkitItem[]) {
  return toolkits
    .filter((t) => t.connection?.isActive)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      logo: t.logo ?? null,
      connectedAccountId: t.connection?.connectedAccount?.id ?? null,
    }));
}

/**
 * Resolve the Composio meta-tools (COMPOSIO_SEARCH_TOOLS, etc.) for a user.
 * Returns an empty object when Composio is not configured or unavailable.
 *
 * Cached in-memory with LRU eviction (tools contain functions that can't be
 * serialised to Redis). Invalidated alongside the toolkit cache on
 * connect/disconnect.
 */

const toolsCache = new LRUCache<string, Record<string, unknown>>({
  max: 500,
  ttl: 20 * 60 * 1000, // 20 min
});

export async function getComposioTools(
  userId: string,
): Promise<Record<string, never> | Record<string, unknown>> {
  if (!process.env.COMPOSIO_API_KEY) return {};

  const cached = toolsCache.get(userId);
  if (cached) return cached;

  try {
    const session = await composio.create(userId, {
      manageConnections: false,
      workbench: { enable: false },
    });
    const tools = await session.tools();
    toolsCache.set(userId, tools);
    return tools;
  } catch (err) {
    logger.warn("[composio] Tools unavailable:", { error: err });
    return {};
  }
}

// ---------------------------------------------------------------------------
// Types for the Composio REST API
// ---------------------------------------------------------------------------

export type ToolkitDetail = {
  slug: string;
  name: string;
  meta: {
    description: string;
    logo: string;
    app_url: string | null;
    categories: Array<{ name: string; slug: string }>;
    tools_count: number;
    triggers_count: number;
  };
  composio_managed_auth_schemes: string[];
};

export type ToolItem = {
  slug: string;
  name: string;
  description: string;
  human_description?: string;
  tags: string[];
};

export type ToolsResponse = {
  items: ToolItem[];
  total_items: number;
};
