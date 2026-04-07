import { MCPZed } from "@/components/mcp-zed";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Zed MCP Integration",
  description:
    "Connect Zed to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from the fastest code editor.",
  path: "/mcp/zed",
  og: {
    title: "Zed + Midday",
    description: "Transactions and invoices from Zed",
  },
  keywords: [
    "Zed MCP",
    "Zed editor integration",
    "Model Context Protocol",
    "AI editor financial data",
  ],
});

export default function Page() {
  return <MCPZed />;
}
