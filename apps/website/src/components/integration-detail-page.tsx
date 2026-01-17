"use client";

import { AppLogo } from "@/components/app-logo";
import type { WebsiteApp } from "@/data/apps";
import { apps } from "@/data/apps";
import { Button } from "@midday/ui/button";
import Link from "next/link";

interface Props {
  app: WebsiteApp;
}

export function IntegrationDetailPage({ app }: Props) {
  // Get related apps from same category (excluding current)
  const relatedApps = apps
    .filter((a) => a.category === app.category && a.id !== app.id)
    .slice(0, 3);

  // Parse markdown-style description
  const renderDescription = (text: string | null) => {
    if (!text) return null;

    const parts = text.split("\n\n");
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.includes("**\n")) {
        const [title, ...content] = part.split("\n");
        const cleanTitle = title.replace(/\*\*/g, "");
        return (
          <div key={index} className="mb-6">
            <h3 className="font-sans text-lg text-foreground mb-2">
              {cleanTitle}
            </h3>
            <p className="font-sans text-base text-muted-foreground leading-relaxed">
              {content.join(" ")}
            </p>
          </div>
        );
      }
      return (
        <p
          key={index}
          className="font-sans text-base text-muted-foreground leading-relaxed mb-4"
        >
          {part}
        </p>
      );
    });
  };

  const dashboardUrl = app.active
    ? `https://app.midday.ai/apps?app=${app.id}`
    : undefined;

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-[1400px] mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm font-sans">
            <li>
              <Link
                href="/integrations"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Integrations
              </Link>
            </li>
            <li className="text-muted-foreground">/</li>
            <li className="text-foreground">{app.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 flex items-center justify-center border border-border p-3">
                <AppLogo appId={app.id} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-serif text-3xl lg:text-4xl text-foreground">
                    {app.name}
                  </h1>
                  {app.beta && (
                    <span className="text-xs font-sans text-foreground bg-secondary px-2 py-1">
                      Beta
                    </span>
                  )}
                  {!app.active && (
                    <span className="text-xs font-sans text-muted-foreground bg-secondary px-2 py-1">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-muted-foreground">
                  {app.category}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <p className="font-sans text-lg text-foreground leading-relaxed mb-8">
                {app.short_description}
              </p>

              {app.description && (
                <div className="border-t border-border pt-8">
                  {renderDescription(app.description)}
                </div>
              )}
            </div>

            {/* Features */}
            {app.features.length > 0 && (
              <div className="border border-border p-6 lg:p-8">
                <h2 className="font-sans text-lg text-foreground mb-6">
                  Key Features
                </h2>
                <ul className="space-y-4">
                  {app.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-foreground mt-2 flex-shrink-0" />
                      <span className="font-sans text-base text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* CTA Card */}
              <div className="border border-border p-6">
                <h3 className="font-sans text-lg text-foreground mb-4">
                  {app.active ? "Get started" : "Coming soon"}
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-6">
                  {app.active
                    ? `Connect ${app.name} to your Midday account and start automating your workflow.`
                    : `We're working on the ${app.name} integration. Sign up to be notified when it's ready.`}
                </p>
                {dashboardUrl ? (
                  <Button asChild className="w-full">
                    <a href={dashboardUrl}>Connect {app.name}</a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/support">Get notified</Link>
                  </Button>
                )}
              </div>

              {/* Related Apps */}
              {relatedApps.length > 0 && (
                <div className="border border-border p-6">
                  <h3 className="font-sans text-sm text-muted-foreground mb-4">
                    Related integrations
                  </h3>
                  <div className="space-y-4">
                    {relatedApps.map((relatedApp) => (
                      <Link
                        key={relatedApp.id}
                        href={`/integrations/${relatedApp.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          <AppLogo appId={relatedApp.id} />
                        </div>
                        <span className="font-sans text-sm text-foreground group-hover:text-muted-foreground transition-colors">
                          {relatedApp.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
