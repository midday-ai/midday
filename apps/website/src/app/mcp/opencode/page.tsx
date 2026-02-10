import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPOpenCode } from "@/components/mcp-opencode";

const title = "OpenCode MCP Integration";
const description =
  "Connect OpenCode to your Midday data via MCP. Track time for client projects, start timers, and log hours directly from your terminal.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "OpenCode MCP",
    "OpenCode integration",
    "Model Context Protocol",
    "terminal time tracking",
    "developer tools",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/opencode`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/opencode`,
  },
};

export default function Page() {
  return <MCPOpenCode />;
}
