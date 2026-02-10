"use client";

import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { apps } from "@/data/apps";

interface IntegrationsSectionProps {
  title?: string;
  subtitle?: string;
}

// Split apps into two rows for animation
const midpoint = Math.ceil(apps.length / 2);
const row1Apps = apps.slice(0, midpoint);
const row2Apps = apps.slice(midpoint);

function IntegrationPill({
  id,
  name,
  slug,
}: {
  id: string;
  name: string;
  slug: string;
}) {
  return (
    <Link
      href={`/integrations/${slug}`}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background whitespace-nowrap hover:border-foreground/20 transition-colors"
    >
      <div className="w-4 h-4 flex-shrink-0">
        <AppLogo appId={id} />
      </div>
      <span className="font-sans text-sm text-foreground">{name}</span>
    </Link>
  );
}

export function IntegrationsSection({
  title = "Works with the tools you already use",
  subtitle = "Connect your banks, email, payments and accounting software in minutes.",
}: IntegrationsSectionProps) {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-10">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            {title}
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal">
            {subtitle}
          </p>
        </div>

        {/* Animated pill rows */}
        <div className="relative overflow-hidden group/integrations">
          {/* Gradient fade masks */}
          <div
            className="absolute inset-y-0 left-0 w-24 sm:w-32 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 30%, hsla(var(--background), 0.8) 50%, hsla(var(--background), 0.4) 70%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-24 sm:w-32 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 30%, hsla(var(--background), 0.8) 50%, hsla(var(--background), 0.4) 70%, transparent 100%)",
            }}
          />

          <div className="space-y-3">
            {/* Row 1 - moves left */}
            <div className="flex animate-marquee-left group-hover/integrations:[animation-play-state:paused] will-change-transform">
              <div className="flex gap-2 shrink-0 pr-2">
                {row1Apps.map((app) => (
                  <IntegrationPill
                    key={app.id}
                    id={app.id}
                    name={app.name}
                    slug={app.slug}
                  />
                ))}
              </div>
              <div className="flex gap-2 shrink-0 pr-2" aria-hidden="true">
                {row1Apps.map((app) => (
                  <IntegrationPill
                    key={`dup-${app.id}`}
                    id={app.id}
                    name={app.name}
                    slug={app.slug}
                  />
                ))}
              </div>
            </div>

            {/* Row 2 - moves right */}
            <div className="flex animate-marquee-right group-hover/integrations:[animation-play-state:paused] will-change-transform">
              <div className="flex gap-2 shrink-0 pr-2">
                {row2Apps.map((app) => (
                  <IntegrationPill
                    key={app.id}
                    id={app.id}
                    name={app.name}
                    slug={app.slug}
                  />
                ))}
              </div>
              <div className="flex gap-2 shrink-0 pr-2" aria-hidden="true">
                {row2Apps.map((app) => (
                  <IntegrationPill
                    key={`dup-${app.id}`}
                    id={app.id}
                    name={app.name}
                    slug={app.slug}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link
            href="/integrations"
            className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            View all integrations
          </Link>
        </div>
      </div>
    </section>
  );
}
