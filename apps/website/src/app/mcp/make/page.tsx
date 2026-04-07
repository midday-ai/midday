import { MCPMake } from "@/components/mcp-make";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Make MCP Integration",
  description:
    "Connect Midday to Make scenarios via MCP. Build visual automations with your financial data and connect to 1,500+ apps.",
  path: "/mcp/make",
  og: {
    title: "Make + Midday",
    description: "Visual automations for your financial data",
  },
  keywords: [
    "Make MCP",
    "Make integration",
    "Model Context Protocol",
    "visual automation",
    "no-code workflows",
  ],
});

export default function Page() {
  return <MCPMake />;
}
