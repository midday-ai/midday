import { MCPMake } from "@/components/mcp-make";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for Make",
  description:
    "Connect Midday to Make scenarios via MCP. Build visual automations with your financial data.",
};

export default function Page() {
  return <MCPMake />;
}
