import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { MCPPerplexity } from "@/components/mcp-perplexity";

const title = "Perplexity MCP Integration";
const description =
  "Connect Perplexity to your Midday data via MCP. Query transactions, invoices, and financial reports with natural language AI search.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Perplexity MCP",
    "Perplexity integration",
    "Model Context Protocol",
    "AI search",
    "natural language queries",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/mcp/perplexity`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/mcp/perplexity`,
  },
};

export default function Page() {
  return <MCPPerplexity />;
}
