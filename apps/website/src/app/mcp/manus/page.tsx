import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPManus } from "@/components/mcp-manus";

const title = "Manus MCP Integration";
const description =
  "Connect Manus to your Midday data via Model Context Protocol. Automate financial workflows with AI agents.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Manus MCP",
    "Manus integration",
    "Model Context Protocol",
    "AI agent financial data",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/manus`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/manus`,
  },
};

export default function Page() {
  return <MCPManus />;
}
