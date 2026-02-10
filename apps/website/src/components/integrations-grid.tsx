import { cn } from "@midday/ui/cn";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import type { WebsiteApp } from "@/data/apps";
import { categories, getCategoryName } from "@/data/apps";

interface IntegrationsGridProps {
  apps: WebsiteApp[];
  activeCategory: string;
}

export function IntegrationsGrid({
  apps,
  activeCategory,
}: IntegrationsGridProps) {
  return (
    <div className="pt-32 pb-24">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto mb-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">
            Integrations
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-normal">
            Connect Midday with the tools you already use. From email and
            messaging to accounting software, our integrations help you
            streamline your financial workflow.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-[1400px] mx-auto mb-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => {
            const href =
              category.id === "all"
                ? "/integrations"
                : `/integrations/category/${category.id}`;

            return (
              <Link
                key={category.id}
                href={href}
                className={cn(
                  "px-4 py-2 text-sm font-sans border transition-colors",
                  activeCategory === category.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground",
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/integrations/${app.slug}`}
              className="group border border-border p-6 hover:border-foreground/20 transition-all duration-200 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "h-10 flex items-center justify-center overflow-hidden rounded-lg",
                    app.id.includes("-mcp") ? "w-10" : "w-10",
                  )}
                >
                  <AppLogo appId={app.id} />
                </div>
                <div className="flex gap-1">
                  {app.beta && (
                    <span className="font-sans text-xs text-primary bg-muted px-2 py-1">
                      Beta
                    </span>
                  )}
                  {!app.active && (
                    <span className="font-sans text-xs text-muted-foreground bg-muted px-2 py-1">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-sans text-lg text-foreground mb-2">
                {app.name}
              </h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed flex-1">
                {app.short_description}
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-sans text-muted-foreground">
                  {getCategoryName(app.category)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-[1400px] mx-auto mt-24 pb-24">
        <div className="bg-background border border-border p-8 lg:p-12 text-center relative before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-60deg,rgba(219,219,219,0.4),rgba(219,219,219,0.4)_1px,transparent_1px,transparent_6px)] dark:before:bg-[repeating-linear-gradient(-60deg,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_1px,transparent_1px,transparent_6px)] before:pointer-events-none">
          <div className="relative z-10">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground mb-4">
              Don't see what you need?
            </h2>
            <p className="font-sans text-base text-muted-foreground mb-6 max-w-lg mx-auto">
              We're always adding new integrations. Let us know what tools you'd
              like to connect with Midday.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background font-sans text-sm hover:opacity-90 transition-opacity"
            >
              Request an integration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
