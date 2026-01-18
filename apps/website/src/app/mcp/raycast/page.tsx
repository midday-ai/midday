import { MCPRaycast } from "@/components/mcp-raycast";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Raycast",
  description:
    "Access Midday financial data directly from Raycast via MCP. Financial tools at your fingertips.",
};

export default function Page() {
  return <MCPRaycast />;
}
