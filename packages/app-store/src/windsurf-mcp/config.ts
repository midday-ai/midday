import { Logo } from "./assets/logo";

export default {
  name: "Windsurf",
  id: "windsurf-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Windsurf to your Midday financial data via MCP with OAuth.",
  description: `Connect Windsurf to your Midday account using the Model Context Protocol (MCP). No API key needed — authentication is handled automatically via OAuth.

**What you can do:**
- Query transactions, invoices, and reports from your AI IDE
- Get financial insights while you code
- Track time and manage invoices without switching apps

**Setup steps:**
1. Open Windsurf and go to **MCP Marketplace** in Settings (or edit \`mcp_config.json\`)
2. Add a new server with URL: \`https://api.midday.ai/mcp\`
3. When prompted, sign in to Midday in your browser and select a team

**Requirements:** Windsurf IDE installed.`,
  images: [],
  installUrl: "https://midday.ai/mcp/windsurf",
};
