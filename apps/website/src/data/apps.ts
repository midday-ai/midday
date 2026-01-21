// Import apps from the app-store package (source of truth)
import { apps as appStoreApps } from "@midday/app-store";

export interface WebsiteApp {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  beta?: boolean;
  short_description: string;
  description: string | null;
  features: string[];
  installUrl?: string;
}

// Website-specific extensions for each app (features and slugs only)
const appExtensions: Record<
  string,
  { slug: string; features: string[]; installUrl?: string }
> = {
  gmail: {
    slug: "gmail",
    features: [
      "Continuous inbox monitoring",
      "Automatic PDF extraction",
      "Smart transaction matching",
      "Secure OAuth authentication",
    ],
  },
  outlook: {
    slug: "outlook",
    features: [
      "Continuous inbox monitoring",
      "Automatic PDF extraction",
      "Smart transaction matching",
      "Secure OAuth authentication",
    ],
  },
  slack: {
    slug: "slack",
    features: [
      "Real-time transaction notifications",
      "Direct receipt upload from Slack",
      "Smart document matching",
      "One-click approve or decline",
    ],
  },
  whatsapp: {
    slug: "whatsapp",
    features: [
      "QR code setup - no app needed",
      "Forward receipts on the go",
      "Smart document matching",
      "One-tap approve or decline",
    ],
  },
  xero: {
    slug: "xero",
    features: [
      "Manual transaction export",
      "Receipt & invoice attachments",
      "Smart categorization mapping",
      "Faster book closing",
    ],
  },
  quickbooks: {
    slug: "quickbooks",
    features: [
      "Export as purchases and sales receipts",
      "Automatic document attachment",
      "Smart account mapping",
      "Efficient bookkeeping",
    ],
  },
  fortnox: {
    slug: "fortnox",
    features: [
      "Export transactions as vouchers",
      "Automatic attachments",
      "Swedish BAS account mapping",
      "Compliance-ready exports",
    ],
  },
  raycast: {
    slug: "raycast",
    features: [
      "Start/stop timers instantly",
      "Project selection",
      "Create new projects",
      "Keyboard-first workflow",
    ],
  },
  "stripe-payments": {
    slug: "stripe-payments",
    features: [
      "Accept credit cards on invoices",
      "Apple Pay & Google Pay support",
      "Automatic status updates",
      "Secure Stripe processing",
    ],
  },
  stripe: {
    slug: "stripe",
    features: [
      "Sync payments automatically",
      "Revenue data import",
      "Transaction matching",
      "Real-time updates",
    ],
  },
  "midday-desktop": {
    slug: "midday-desktop",
    features: [
      "One-click access to finances",
      "Track time from menu bar",
      "Manage invoices",
      "Native Mac experience",
    ],
    installUrl: "https://abacuslabs.com/download",
  },
  "google-drive": {
    slug: "google-drive",
    features: [
      "Automatic file sync",
      "Document organization",
      "Seamless backup",
      "Easy file access",
    ],
  },
  dropbox: {
    slug: "dropbox",
    features: [
      "Automatic file sync",
      "Document organization",
      "Seamless backup",
      "Easy file access",
    ],
  },
  polar: {
    slug: "polar",
    features: [
      "Sync subscription payments",
      "Revenue tracking",
      "Customer insights",
      "Automated reconciliation",
    ],
  },
  deel: {
    slug: "deel",
    features: [
      "Sync contractor payments",
      "Payroll integration",
      "Compliance tracking",
      "Global workforce support",
    ],
  },
  "e-invoice": {
    slug: "e-invoice",
    features: [
      "Peppol network support",
      "European compliance",
      "Send & receive e-invoices",
      "Automated processing",
    ],
  },
  "cursor-mcp": {
    slug: "cursor-mcp",
    features: [
      "Financial context in your editor",
      "Query transactions while coding",
      "One-click install via deeplink",
      "27 tools for financial data",
    ],
    installUrl: "https://abacuslabs.com/mcp/cursor",
  },
  "claude-mcp": {
    slug: "claude-mcp",
    features: [
      "Conversations with real numbers",
      "Works with Claude Code & Desktop",
      "Query invoices and reports",
      "Granular permission controls",
    ],
    installUrl: "https://abacuslabs.com/mcp/claude",
  },
  "raycast-mcp": {
    slug: "raycast-mcp",
    features: [
      "Financial tools at your fingertips",
      "Keyboard-first access",
      "One-click install via deeplink",
      "@-mention in Raycast AI",
    ],
    installUrl: "https://abacuslabs.com/mcp/raycast",
  },
  "chatgpt-mcp": {
    slug: "chatgpt-mcp",
    features: [
      "Build with the MCP SDK",
      "Custom integrations",
      "Programmatic data access",
      "TypeScript support",
    ],
    installUrl: "https://abacuslabs.com/mcp/chatgpt",
  },
};

// Merge app-store data with website extensions
export const apps: WebsiteApp[] = appStoreApps
  .map((app): WebsiteApp | null => {
    const extension = appExtensions[app.id];
    if (!extension) return null;

    const appWithCategory = app as {
      category?: string;
      beta?: boolean;
      installUrl?: string;
    };

    return {
      id: app.id,
      name: app.name,
      slug: extension.slug,
      category: appWithCategory.category || "Other",
      active: app.active,
      beta: appWithCategory.beta,
      short_description: app.short_description || "",
      description: app.description || null,
      features: extension.features,
      installUrl: extension.installUrl || appWithCategory.installUrl,
    };
  })
  .filter((app): app is WebsiteApp => app !== null);

export const categories = [
  { id: "all", name: "All" },
  { id: "ai", name: "AI" },
  { id: "inbox", name: "Inbox" },
  { id: "productivity", name: "Productivity" },
  { id: "accounting", name: "Accounting" },
  { id: "payments", name: "Payments" },
  { id: "storage", name: "Storage" },
  { id: "payroll", name: "Payroll" },
  { id: "invoicing", name: "Invoicing" },
];

export function getAppBySlug(slug: string): WebsiteApp | undefined {
  return apps.find((app) => app.slug === slug);
}

export function getAppsByCategory(category: string): WebsiteApp[] {
  if (category === "all") return apps;
  return apps.filter(
    (app) => app.category.toLowerCase().replace(" ", "-") === category,
  );
}

export function getAllSlugs(): string[] {
  return apps.map((app) => app.slug);
}
