import { MCPOpenCode } from "@/components/mcp-opencode";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for OpenCode",
  description:
    "Track time for client projects directly from OpenCode. Start timers, log hours, and check tracked time from your terminal.",
};

export default function Page() {
  return <MCPOpenCode />;
}
