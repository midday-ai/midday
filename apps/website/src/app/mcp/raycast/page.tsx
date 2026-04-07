import { MCPRaycast } from "@/components/mcp-raycast";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Raycast MCP Integration",
  description:
    "Access Midday financial data directly from Raycast via MCP. Keyboard-first access to invoices, transactions, and business reports.",
  path: "/mcp/raycast",
  og: {
    title: "Raycast + Midday",
    description: "Keyboard-first access to your business data",
  },
  keywords: [
    "Raycast MCP",
    "Raycast integration",
    "Model Context Protocol",
    "Raycast extension",
    "productivity tools",
  ],
});

export default function Page() {
  return <MCPRaycast />;
}
