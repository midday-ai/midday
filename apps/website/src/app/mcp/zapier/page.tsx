import { MCPZapier } from "@/components/mcp-zapier";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Zapier MCP Integration",
  description:
    "Connect Midday to 7,000+ apps through Zapier via MCP. Automate financial reports, alerts, and workflows without writing code.",
  path: "/mcp/zapier",
  og: {
    title: "Zapier + Midday",
    description: "Connect your business to 7,000+ apps",
  },
  keywords: [
    "Zapier MCP",
    "Zapier integration",
    "Model Context Protocol",
    "workflow automation",
    "no-code automation",
  ],
});

export default function Page() {
  return <MCPZapier />;
}
