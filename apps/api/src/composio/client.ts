import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

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
