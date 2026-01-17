// Import apps from the app-store package (source of truth)
// We extend with website-specific data like static image paths and URL slugs
import { apps as appStoreApps } from "@midday/app-store";

export interface WebsiteApp {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  beta?: boolean;
  logo: string; // Static image path for website
  short_description: string;
  description: string | null;
  features: string[];
  installUrl?: string;
}

// Website-specific extensions for each app
const appExtensions: Record<
  string,
  { slug: string; logo: string; features: string[]; installUrl?: string }
> = {
  gmail: {
    slug: "gmail",
    logo: "/images/gmail.svg",
    features: [
      "Continuous inbox monitoring",
      "Automatic PDF extraction",
      "Smart transaction matching",
      "Secure OAuth authentication",
    ],
  },
  outlook: {
    slug: "outlook",
    logo: "/images/outlook.svg",
    features: [
      "Continuous inbox monitoring",
      "Automatic PDF extraction",
      "Smart transaction matching",
      "Secure OAuth authentication",
    ],
  },
  slack: {
    slug: "slack",
    logo: "/images/slack.svg",
    features: [
      "Real-time transaction notifications",
      "Direct receipt upload from Slack",
      "Smart document matching",
      "One-click approve or decline",
    ],
  },
  whatsapp: {
    slug: "whatsapp",
    logo: "/images/whatsapp.svg",
    features: [
      "QR code setup - no app needed",
      "Forward receipts on the go",
      "Smart document matching",
      "One-tap approve or decline",
    ],
  },
  xero: {
    slug: "xero",
    logo: "/images/xero.svg",
    features: [
      "Manual transaction export",
      "Receipt & invoice attachments",
      "Smart categorization mapping",
      "Faster book closing",
    ],
  },
  quickbooks: {
    slug: "quickbooks",
    logo: "/images/quickbooks.svg",
    features: [
      "Export as purchases and sales receipts",
      "Automatic document attachment",
      "Smart account mapping",
      "Efficient bookkeeping",
    ],
  },
  fortnox: {
    slug: "fortnox",
    logo: "/images/fortnox.svg",
    features: [
      "Export transactions as vouchers",
      "Automatic attachments",
      "Swedish BAS account mapping",
      "Compliance-ready exports",
    ],
  },
  raycast: {
    slug: "raycast",
    logo: "/images/raycast.svg",
    features: [
      "Start/stop timers instantly",
      "Project selection",
      "Create new projects",
      "Keyboard-first workflow",
    ],
  },
  "stripe-payments": {
    slug: "stripe-payments",
    logo: "/images/stripe.svg",
    features: [
      "Accept credit cards on invoices",
      "Apple Pay & Google Pay support",
      "Automatic status updates",
      "Secure Stripe processing",
    ],
  },
  stripe: {
    slug: "stripe",
    logo: "/images/stripe.svg",
    features: [
      "Sync payments automatically",
      "Revenue data import",
      "Transaction matching",
      "Real-time updates",
    ],
  },
  "midday-desktop": {
    slug: "midday-desktop",
    logo: "/images/midday-icon.svg",
    features: [
      "One-click access to finances",
      "Track time from menu bar",
      "Manage invoices",
      "Native Mac experience",
    ],
    installUrl: "https://midday.ai/download",
  },
  "google-drive": {
    slug: "google-drive",
    logo: "/images/gdrive.svg",
    features: [
      "Automatic file sync",
      "Document organization",
      "Seamless backup",
      "Easy file access",
    ],
  },
  dropbox: {
    slug: "dropbox",
    logo: "/images/dropbox.svg",
    features: [
      "Automatic file sync",
      "Document organization",
      "Seamless backup",
      "Easy file access",
    ],
  },
  polar: {
    slug: "polar",
    logo: "/images/polar.svg",
    features: [
      "Sync subscription payments",
      "Revenue tracking",
      "Customer insights",
      "Automated reconciliation",
    ],
  },
  deel: {
    slug: "deel",
    logo: "/images/deel.svg",
    features: [
      "Sync contractor payments",
      "Payroll integration",
      "Compliance tracking",
      "Global workforce support",
    ],
  },
  "e-invoice": {
    slug: "e-invoice",
    logo: "/images/e-invoice.svg",
    features: [
      "Peppol network support",
      "European compliance",
      "Send & receive e-invoices",
      "Automated processing",
    ],
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
      logo: extension.logo,
      short_description: app.short_description || "",
      description: app.description || null,
      features: extension.features,
      installUrl: extension.installUrl || appWithCategory.installUrl,
    };
  })
  .filter((app): app is WebsiteApp => app !== null);

export const categories = [
  { id: "all", name: "All" },
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
