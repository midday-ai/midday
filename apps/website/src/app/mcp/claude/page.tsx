import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPClaude } from "@/components/mcp-claude";

const title = "Claude MCP Integration";
const description =
  "Connect Claude to your Midday data via Model Context Protocol. Get AI-powered financial insights grounded in your real business numbers.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Claude MCP",
    "Claude integration",
    "Model Context Protocol",
    "Anthropic Claude",
    "AI financial assistant",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/claude`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/claude`,
  },
};

export default function Page() {
  return <MCPClaude />;
}
