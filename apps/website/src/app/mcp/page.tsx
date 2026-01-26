import { MCP } from "@/components/mcp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Server",
  description:
    "Connect Cursor, Claude, Raycast, or ChatGPT to your abacus data. Ask questions, generate reports, and get answers based on what's actually happening in your business.",
};

export default function Page() {
  return <MCP />;
}
