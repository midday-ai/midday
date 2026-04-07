import { MCPCursor } from "@/components/mcp-cursor";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Cursor MCP Integration",
  description:
    "Connect Cursor to your Midday data via MCP. Track time, query finances, and access business data directly from your AI-powered code editor.",
  path: "/mcp/cursor",
  og: {
    title: "Cursor + Midday",
    description: "Track time and query finances from your editor",
  },
  keywords: [
    "Cursor MCP",
    "Cursor integration",
    "Model Context Protocol",
    "AI coding assistant",
    "time tracking Cursor",
  ],
});

export default function Page() {
  return <MCPCursor />;
}
