import { MCPCline } from "@/components/mcp-cline";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Cline MCP Integration",
  description:
    "Connect Cline to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from VS Code.",
  path: "/mcp/cline",
  og: {
    title: "Cline + Midday",
    description: "Query your business data from VS Code",
  },
  keywords: [
    "Cline MCP",
    "Cline integration",
    "Model Context Protocol",
    "VS Code financial data",
  ],
});

export default function Page() {
  return <MCPCline />;
}
