import { MCPCopilot } from "@/components/mcp-copilot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Microsoft Copilot",
  description:
    "Connect Midday to Microsoft Copilot Studio. Query invoices, transactions, and reports from Word, Excel, Outlook, or any Copilot-enabled app.",
};

export default function Page() {
  return <MCPCopilot />;
}
