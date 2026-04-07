import { MCP } from "@/components/mcp";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "AI Integrations via MCP — Claude, ChatGPT, Cursor & More",
  description:
    "Run your business from any AI tool via Model Context Protocol (MCP). Create invoices, export to your accountant, track time, and manage transactions from Cursor, Claude, ChatGPT, Raycast, or Zapier.",
  path: "/mcp",
  og: {
    title: "AI Integrations",
    description: "Run your business from any AI tool via MCP",
  },
  keywords: [
    "MCP",
    "Model Context Protocol",
    "AI integration",
    "Claude MCP",
    "Cursor MCP",
    "business automation",
  ],
});

export default function Page() {
  return <MCP />;
}
