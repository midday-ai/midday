import { DocsChat } from "@/components/docs/chat";
import { DocsSidebarToggle } from "@/components/docs/sidebar-toggle";
import { docsNavigation } from "@/lib/docs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Learn how to use Midday to run your business finances. Get answers about invoicing, banking, time tracking, reports, and more.",
};

const popularGuides = [
  {
    title: "Getting Started",
    href: "/docs/introduction",
    description: "What is Midday?",
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
    title: "Time Tracking",
    href: "/docs/track-time-timer",
    description: "Track billable hours",
  },
  {
    title: "Export",
    href: "/docs/export-transactions-csv",
    description: "For your accountant",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Sidebar toggle */}
      <DocsSidebarToggle navigation={docsNavigation} />

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center pt-24 md:pt-32 pb-12">
        {/* Hero */}
        <div className="text-center px-4 mb-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Documentation
          </p>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4">
            Ask Midday
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Get instant answers about invoicing, banking, time tracking, reports, and more.
          </p>
        </div>

        {/* Chat */}
        <div className="max-w-2xl mx-auto w-full px-4">
          <DocsChat />
        </div>
      </div>

      {/* Popular guides */}
      <div className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground text-center mb-8">
            Popular guides
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {popularGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group bg-background p-6 hover:bg-secondary/30 transition-colors"
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
      </div>
    </div>
  );
}
