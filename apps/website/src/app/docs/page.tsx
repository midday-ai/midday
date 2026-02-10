import type { Metadata } from "next";
import Link from "next/link";
import { baseUrl } from "@/app/sitemap";
import { DocsHomeHero } from "@/components/docs/docs-home-hero";

const title = "Documentation";
const description =
  "Learn how to use Midday to run your business finances. Get answers about invoicing, banking, time tracking, reports, and more.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/docs`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/docs`,
  },
};

const popularGuides = [
  {
    title: "Getting Started",
    href: "/docs/introduction",
    description: "What is Midday and how it helps you",
  },
  {
    title: "Quick Start",
    href: "/docs/quick-start",
    description: "Get running in 5 minutes",
  },
  {
    title: "Create Invoice",
    href: "/docs/create-invoice",
    description: "Send professional invoices",
  },
  {
    title: "Connect Bank",
    href: "/docs/connect-bank-account",
    description: "Link your accounts",
  },
  {
    title: "Receipt Matching",
    href: "/docs/receipt-matching",
    description: "AI-powered matching",
  },
  {
    title: "Understanding Metrics",
    href: "/docs/understanding-metrics",
    description: "How your numbers work",
  },
];

const sections = [
  {
    title: "Getting Started",
    links: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Desktop App", href: "/docs/desktop-app" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
    ],
  },
  {
    title: "Banking",
    links: [
      { title: "Connect Bank", href: "/docs/connect-bank-account" },
      { title: "Categorization", href: "/docs/auto-categorization" },
      { title: "Multi-Currency", href: "/docs/multi-currency" },
      { title: "Categories Reference", href: "/docs/categories-reference" },
    ],
  },
  {
    title: "Inbox & Vault",
    links: [
      { title: "Receipt Matching", href: "/docs/receipt-matching" },
      { title: "Connect Gmail", href: "/docs/connect-gmail" },
      { title: "Connect Slack", href: "/docs/connect-slack" },
      { title: "File Storage", href: "/docs/vault-file-storage" },
    ],
  },
  {
    title: "Invoicing",
    links: [
      { title: "Create Invoice", href: "/docs/create-invoice" },
      { title: "Recurring Invoices", href: "/docs/set-up-recurring-invoice" },
      { title: "Accept Payments", href: "/docs/accept-online-payments" },
      { title: "Invoice Settings", href: "/docs/invoice-settings" },
    ],
  },
  {
    title: "Time Tracking",
    links: [
      { title: "Create Project", href: "/docs/create-project" },
      { title: "Track Time", href: "/docs/track-time-timer" },
      { title: "Invoice Time", href: "/docs/invoice-tracked-time" },
    ],
  },
  {
    title: "Reports",
    links: [
      { title: "Understanding Metrics", href: "/docs/understanding-metrics" },
      { title: "Revenue & Profit", href: "/docs/view-revenue-profit" },
      { title: "Burn Rate", href: "/docs/view-burn-rate" },
      { title: "Runway", href: "/docs/check-runway" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { title: "Apps Overview", href: "/docs/apps-overview" },
      { title: "Xero", href: "/docs/connect-xero" },
      { title: "QuickBooks", href: "/docs/connect-quickbooks" },
      { title: "Fortnox", href: "/docs/connect-fortnox" },
    ],
  },
  {
    title: "Assistant",
    links: [
      { title: "Using Assistant", href: "/docs/using-assistant" },
      { title: "AI Tools (MCP)", href: "/docs/assistant-mcp" },
    ],
  },
  {
    title: "Developer",
    links: [
      { title: "API Reference", href: "/docs/api-reference" },
      { title: "Build OAuth Apps", href: "/docs/build-oauth-app" },
      { title: "OAuth Scopes", href: "/docs/oauth-scopes" },
      { title: "App Review", href: "/docs/app-review-process" },
    ],
  },
  {
    title: "Team",
    links: [
      { title: "Team Members", href: "/docs/invite-team-member" },
      { title: "Notifications", href: "/docs/notification-settings" },
      { title: "Billing", href: "/docs/manage-subscription" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] pb-32 md:pb-24">
      {/* Hero with centered chat */}
      <DocsHomeHero />

      {/* Popular guides */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Popular guides
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {popularGuides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group bg-background p-5 hover:bg-secondary/30 transition-colors"
            >
              <span className="block text-sm font-medium text-foreground mb-1">
                {guide.title}
              </span>
              <span className="block text-sm text-muted-foreground">
                {guide.description}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* All sections */}
      <div className="max-w-4xl mx-auto px-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Browse by topic
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-foreground mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
