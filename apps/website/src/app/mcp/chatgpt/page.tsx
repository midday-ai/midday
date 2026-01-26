import { MCPChatGPT } from "@/components/mcp-chatgpt";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP for ChatGPT",
  description:
    "Build custom ChatGPT integrations with abacus using the MCP SDK. Connect OpenAI-powered apps to your financial data.",
};

export default function Page() {
  return <MCPChatGPT />;
}
