import { MCPCursor } from "@/components/mcp-cursor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Cursor",
  description:
    "Track time for client projects directly from Cursor. Start timers, log hours, and check tracked time without leaving your editor.",
};

export default function Page() {
  return <MCPCursor />;
}
