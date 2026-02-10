import { Button } from "@midday/ui/button";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { CustomMDX } from "@/components/mdx";
import type { WebsiteApp } from "@/data/apps";
import { apps, getCategoryName } from "@/data/apps";

interface Props {
  app: WebsiteApp;
}

export function IntegrationDetailPage({ app }: Props) {
  // Get related apps from same category (excluding current)
  const relatedApps = apps
    .filter((a) => a.category === app.category && a.id !== app.id)
    .slice(0, 3);

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
              <div className="w-16 h-16 flex items-center justify-center">
                <AppLogo appId={app.id} className="w-14 h-14" />
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
                  {getCategoryName(app.category)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <p className="font-sans text-lg text-foreground leading-relaxed mb-8">
                {app.short_description}
              </p>

              {app.description && (
                <div className="border-t border-border pt-8 updates app-description">
                  <CustomMDX source={app.description} />
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
                  {app.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
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
                        <div className="w-10 h-10 flex items-center justify-center">
                          <AppLogo appId={relatedApp.id} className="w-8 h-8" />
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
