import { MCPN8n } from "@/components/mcp-n8n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for n8n",
  description:
    "Connect Midday to n8n workflows via MCP. Build automated financial workflows with AI agents.",
};

export default function Page() {
  return <MCPN8n />;
}
