import { Button } from "@midday/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Launch Program",
  description:
    "Get up and running with Abacus in 30 days. Custom implementation, Google Sheet migration, dashboard setup, and team training — all handled for you.",
};

export default function LaunchProgramPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-32 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Hero */}
            <div className="space-y-6 text-center">
              <h1 className="font-serif text-3xl lg:text-4xl leading-tight text-foreground">
                Launch Program
              </h1>
              <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
                Get your entire portfolio migrated and your team trained in 30
                days or less. We handle everything.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="h-px w-full max-w-xs border-t border-border" />
            </div>

            {/* What's Included */}
            <section className="space-y-6">
              <h2 className="font-sans text-base text-foreground text-center">
                What's included
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-background border border-border p-6 space-y-3">
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    Portfolio Migration
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    We connect your Google Sheet or existing data source and map
                    every field. Your historical data comes with you.
                  </p>
                </div>
                <div className="bg-background border border-border p-6 space-y-3">
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    Dashboard Configuration
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Custom widgets, alerts, and views tailored to how you
                    actually run your business. Not a generic setup.
                  </p>
                </div>
                <div className="bg-background border border-border p-6 space-y-3">
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    Branded Portal Setup
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Your logo, your colors, your domain. Give your merchants a
                    professional portal that looks like yours.
                  </p>
                </div>
                <div className="bg-background border border-border p-6 space-y-3">
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    Team Training
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Live walkthroughs for your team so everyone knows how to use
                    the system from day one. No guesswork.
                  </p>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="h-px w-full max-w-xs border-t border-border" />
            </div>

            {/* Process */}
            <section className="space-y-8">
              <h2 className="font-sans text-base text-foreground text-center">
                How it works
              </h2>
              <div className="grid sm:grid-cols-3 gap-8">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 mx-auto border border-border rounded-full flex items-center justify-center">
                    <span className="font-sans text-sm text-foreground">1</span>
                  </div>
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    Schedule a call
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    We'll review your current setup and understand exactly what
                    you need.
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 mx-auto border border-border rounded-full flex items-center justify-center">
                    <span className="font-sans text-sm text-foreground">2</span>
                  </div>
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    We build it
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Our team migrates your data, configures your dashboard, and
                    sets up your portal.
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 mx-auto border border-border rounded-full flex items-center justify-center">
                    <span className="font-sans text-sm text-foreground">3</span>
                  </div>
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    You launch
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Go live with a fully configured system and a trained team.
                    We're there if you need us.
                  </p>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="h-px w-full max-w-xs border-t border-border" />
            </div>

            {/* Pricing */}
            <section className="space-y-6 text-center">
              <h2 className="font-sans text-base text-foreground">Pricing</h2>
              <div className="bg-background border border-border p-8 max-w-md mx-auto space-y-4">
                <p className="font-sans text-2xl text-foreground">
                  Custom pricing
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Every MCA operation is different. We'll scope your
                  implementation based on portfolio size, data complexity, and
                  customization needs.
                </p>
              </div>
            </section>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="h-px w-full max-w-xs border-t border-border" />
            </div>

            {/* CTA */}
            <section className="text-center space-y-6">
              <h2 className="font-sans text-base text-foreground">
                Ready to get started?
              </h2>
              <p className="font-sans text-sm text-muted-foreground max-w-lg mx-auto">
                Schedule a consultation to discuss your portfolio and get a
                custom implementation plan.
              </p>
              <Button
                asChild
                className="btn-inverse font-sans text-sm py-3 px-8 transition-colors"
              >
                <Link
                  href="https://cal.com/abacus/implementation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule a consultation
                </Link>
              </Button>
              <p className="font-sans text-xs text-muted-foreground">
                30-minute call · No commitment
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
