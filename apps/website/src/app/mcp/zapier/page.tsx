import { MCPZapier } from "@/components/mcp-zapier";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Zapier",
  description:
    "Connect Midday to 7,000+ apps through Zapier. Automate reports, alerts, and workflows without code.",
};

export default function Page() {
  return <MCPZapier />;
}
