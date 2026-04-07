import { MCPGemini } from "@/components/mcp-gemini";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Gemini MCP Integration",
  description:
    "Connect Gemini CLI to your Midday data via Model Context Protocol. Query transactions, invoices, and reports from your terminal.",
  path: "/mcp/gemini",
  og: {
    title: "Gemini + Midday",
    description: "Business data from your terminal",
  },
  keywords: [
    "Gemini MCP",
    "Gemini CLI integration",
    "Model Context Protocol",
    "Google Gemini",
    "AI financial assistant",
  ],
});

export default function Page() {
  return <MCPGemini />;
}
