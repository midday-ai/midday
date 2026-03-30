import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { CURATED_TOOLKIT_SLUGS } from "@midday/connectors";
import { logger } from "@midday/logger";

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

export async function getTeamToolkits(teamId: string): Promise<ToolkitItem[]> {
  const session = await composio.create(teamId);
  const { items } = await session.toolkits({
    toolkits: [...CURATED_TOOLKIT_SLUGS],
    limit: 100,
  });
  return asToolkitItems(items);
}

export function buildConnectionMap(
  toolkits: ToolkitItem[],
): Map<string, { isConnected: boolean; connectedAccountId: string | null }> {
  const map = new Map<
    string,
    { isConnected: boolean; connectedAccountId: string | null }
  >();

  for (const t of toolkits) {
    if (t.isNoAuth) continue;
    map.set(t.slug, {
      isConnected: t.connection?.isActive ?? false,
      connectedAccountId: t.connection?.connectedAccount?.id ?? null,
    });
  }

  return map;
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
 * Resolve the Composio meta-tools (COMPOSIO_SEARCH_TOOLS, etc.) for a team.
 * Returns an empty object when Composio is not configured or unavailable.
 */
export async function getComposioTools(
  teamId: string,
): Promise<Record<string, never> | Record<string, unknown>> {
  if (!process.env.COMPOSIO_API_KEY) return {};

  try {
    const session = await composio.create(teamId, {
      manageConnections: false,
      workbench: { enable: false },
    });
    return await session.tools();
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
