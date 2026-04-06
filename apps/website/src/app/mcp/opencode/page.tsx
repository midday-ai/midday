import { MCPOpenCode } from "@/components/mcp-opencode";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "OpenCode MCP Integration",
  description:
    "Connect OpenCode to your Midday data via MCP. Track time for client projects, start timers, and log hours directly from your terminal.",
  path: "/mcp/opencode",
  og: {
    title: "OpenCode + Midday",
    description: "Track time and log hours from your terminal",
  },
  keywords: [
    "OpenCode MCP",
    "OpenCode integration",
    "Model Context Protocol",
    "terminal time tracking",
    "developer tools",
  ],
});

export default function Page() {
  return <MCPOpenCode />;
}
