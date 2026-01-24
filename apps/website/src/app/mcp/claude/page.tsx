import { MCPClaude } from "@/components/mcp-claude";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Claude",
  description:
    "Connect Claude to your Abacus data via MCP. Get financial answers grounded in real numbers.",
};

export default function Page() {
  return <MCPClaude />;
}
