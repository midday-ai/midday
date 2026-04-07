import { MCPChatGPT } from "@/components/mcp-chatgpt";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "ChatGPT MCP Integration",
  description:
    "Build custom ChatGPT integrations with Midday using the MCP SDK. Connect OpenAI-powered apps to your business financial data.",
  path: "/mcp/chatgpt",
  og: {
    title: "ChatGPT + Midday",
    description: "Build custom integrations with your business data",
  },
  keywords: [
    "ChatGPT MCP",
    "ChatGPT integration",
    "Model Context Protocol",
    "OpenAI integration",
    "GPT financial data",
  ],
});

export default function Page() {
  return <MCPChatGPT />;
}
