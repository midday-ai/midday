import { MCPCopilot } from "@/components/mcp-copilot";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Microsoft Copilot MCP Integration",
  description:
    "Connect Midday to Microsoft Copilot Studio via MCP. Query invoices, transactions, and reports from Word, Excel, Outlook, or any Copilot-enabled app.",
  path: "/mcp/copilot",
  og: {
    title: "Copilot + Midday",
    description: "Business data in Word, Excel, and Outlook",
  },
  keywords: [
    "Microsoft Copilot MCP",
    "Copilot integration",
    "Model Context Protocol",
    "Microsoft 365",
    "enterprise AI",
  ],
});

export default function Page() {
  return <MCPCopilot />;
}
