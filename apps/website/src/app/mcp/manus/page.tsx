import { MCPManus } from "@/components/mcp-manus";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Manus MCP Integration",
  description:
    "Connect Manus to your Midday data via Model Context Protocol. Automate financial workflows with AI agents.",
  path: "/mcp/manus",
  og: {
    title: "Manus + Midday",
    description: "Automate workflows with AI agents",
  },
  keywords: [
    "Manus MCP",
    "Manus integration",
    "Model Context Protocol",
    "AI agent financial data",
  ],
});

export default function Page() {
  return <MCPManus />;
}
