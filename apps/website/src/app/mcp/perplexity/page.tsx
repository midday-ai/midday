import { MCPPerplexity } from "@/components/mcp-perplexity";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Perplexity MCP Integration",
  description:
    "Connect Perplexity to your Midday data via MCP. Query transactions, invoices, and financial reports with natural language AI search.",
  path: "/mcp/perplexity",
  og: {
    title: "Perplexity + Midday",
    description: "Search your finances with natural language",
  },
  keywords: [
    "Perplexity MCP",
    "Perplexity integration",
    "Model Context Protocol",
    "AI search",
    "natural language queries",
  ],
});

export default function Page() {
  return <MCPPerplexity />;
}
