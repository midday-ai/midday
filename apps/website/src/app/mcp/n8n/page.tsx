import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPN8n } from "@/components/mcp-n8n";

const title = "n8n MCP Integration";
const description =
  "Connect Midday to n8n workflows via MCP. Build automated financial workflows with AI agents and connect to 400+ apps.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "n8n MCP",
    "n8n integration",
    "Model Context Protocol",
    "workflow automation",
    "AI agents",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/n8n`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/n8n`,
  },
};

export default function Page() {
  return <MCPN8n />;
}
