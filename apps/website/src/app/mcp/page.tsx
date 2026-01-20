import { MCP } from "@/components/mcp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Server",
  description:
    "Connect Cursor, Claude, Raycast, ChatGPT, OpenCode, or Zapier to your Midday data. Ask questions, generate reports, and automate workflows based on what's actually happening in your business.",
};

export default function Page() {
  return <MCP />;
}
