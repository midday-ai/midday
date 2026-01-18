import { MCPCursor } from "@/components/mcp-cursor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Cursor",
  description:
    "Connect Cursor to your Midday data via MCP. Access transactions, invoices, and reports while you code.",
};

export default function Page() {
  return <MCPCursor />;
}
