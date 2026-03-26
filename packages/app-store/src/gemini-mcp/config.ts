import { Logo } from "./assets/logo";

export default {
  name: "Gemini",
  id: "gemini-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Gemini CLI to your Midday financial data via MCP with OAuth.",
  description: `Connect Gemini CLI to your Midday account using the Model Context Protocol (MCP). No API key needed — authentication is handled automatically via OAuth.

**What you can do:**
- Query transactions, invoices, and reports in Gemini
- Get financial insights grounded in your real business data
- Create automated reports and summaries
- Manage invoices and track time from your terminal

**Setup steps:**
1. Run: \`gemini mcp add --transport http midday https://api.midday.ai/mcp\`
2. When prompted, sign in to Midday in your browser and select a team
3. Use Midday tools in Gemini CLI to access your financial data

**Requirements:** Gemini CLI installed (see [Gemini CLI docs](https://github.com/google-gemini/gemini-cli) for installation).`,
  images: [],
  installUrl: "https://midday.ai/mcp/gemini",
};
