import { MCP } from "@/components/mcp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Integrations",
  description:
    "Connect Cursor, Claude, Raycast, ChatGPT, OpenCode, Zapier, or Microsoft Copilot to your Midday data. Ask questions, generate reports, and automate workflows.",
};

export default function Page() {
  return <MCP />;
}
