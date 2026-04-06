import { MCPClaude } from "@/components/mcp-claude";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Claude MCP Integration",
  description:
    "Connect Claude to your Midday data via Model Context Protocol. Get AI-powered financial insights grounded in your real business numbers.",
  path: "/mcp/claude",
  og: {
    title: "Claude + Midday",
    description: "Financial insights from your real business data",
  },
  keywords: [
    "Claude MCP",
    "Claude integration",
    "Model Context Protocol",
    "Anthropic Claude",
    "AI financial assistant",
  ],
});

export default function Page() {
  return <MCPClaude />;
}
