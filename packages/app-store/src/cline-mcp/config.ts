import { Logo } from "./assets/logo";

export default {
  name: "Cline",
  id: "cline-mcp",
  category: "ai-automation",
  active: true,
  logo: Logo,
  short_description:
    "Connect Cline to your Midday financial data via MCP with OAuth.",
  description: `Connect Cline to your Midday account using the Model Context Protocol (MCP). No API key needed — authentication is handled automatically via OAuth.

**What you can do:**
- Query transactions, invoices, and reports from VS Code
- Get financial insights while you code
- Track time and manage invoices without switching apps

**Setup steps:**
1. In the Cline sidebar, go to the **Remote Servers** tab
2. Add the server URL: \`https://api.midday.ai/mcp\`
3. Click **Authenticate** and sign in to Midday in your browser

**Requirements:** VS Code with the Cline extension installed.`,
  images: [],
  installUrl: "https://midday.ai/mcp/cline",
};
