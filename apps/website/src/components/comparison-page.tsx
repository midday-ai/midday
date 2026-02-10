"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";
import type { Competitor } from "@/data/competitors";
import { middayDifferentiators } from "@/data/competitors";
import { ComparisonHero } from "./sections/comparison-hero";
import { CompetitorFAQ } from "./sections/competitor-faq";
import { FeatureComparison } from "./sections/feature-comparison";
import { PricingComparison } from "./sections/pricing-comparison";

interface Props {
  competitor: Competitor;
}

export function ComparisonPage({ competitor }: Props) {
  const sections = [
    { id: "differences", label: "Key differences at a glance" },
    { id: "features", label: "Feature comparison" },
    { id: "pricing", label: "Pricing comparison" },
    { id: "switching", label: `Switching from ${competitor.name}` },
    { id: "better-fit", label: "Where Midday is a better fit" },
    { id: "faq", label: "Frequently asked questions" },
  ];

  return (
    <div className="min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-24">
      <div className="max-w-[1400px] mx-auto">
        {/* Hero Section */}
        <ComparisonHero
          competitor={competitor}
          differentiators={middayDifferentiators}
          sections={sections}
        />

        {/* Divider */}
        <div className="my-12 lg:my-16">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* Key Differences Section */}
        <section id="differences" className="scroll-mt-24 mb-16 lg:mb-24">
          <h2 className="font-serif text-2xl text-foreground mb-8 text-center">
            Key differences at a glance
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {competitor.keyDifferences.map((diff) => (
              <div
                key={diff.title}
                className="border border-border overflow-hidden"
              >
                <div className="bg-secondary px-6 py-4 border-b border-border">
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    {diff.title}
                  </h3>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  {/* Midday Column */}
                  <div className="p-6 bg-background relative border-l-4 border-l-primary">
                    <div className="space-y-2">
                      <span className="font-sans text-xs font-semibold text-primary uppercase tracking-wide block">
                        Midday
                      </span>
                      <p className="font-sans text-sm text-foreground leading-relaxed font-medium">
                        {diff.midday}
                      </p>
                    </div>
                  </div>
                  {/* Competitor Column */}
                  <div className="p-6 bg-secondary/50">
                    <div className="space-y-2">
                      <span className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                        {competitor.name}
                      </span>
                      <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                        {diff.competitor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mb-16 lg:mb-24">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* Feature Comparison */}
        <section id="features" className="scroll-mt-24 mb-16 lg:mb-24">
          <FeatureComparison competitor={competitor} />
        </section>

        {/* Divider */}
        <div className="mb-16 lg:mb-24">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* Pricing Comparison */}
        <section id="pricing" className="scroll-mt-24 mb-16 lg:mb-24">
          <PricingComparison competitor={competitor} />
        </section>

        {/* Divider */}
        <div className="mb-16 lg:mb-24">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* Switching Guide */}
        <section id="switching" className="scroll-mt-24 mb-16 lg:mb-24">
          <h2 className="font-serif text-2xl text-foreground mb-4 text-center">
            Switching from {competitor.name} to Midday
          </h2>
          <p className="font-sans text-base text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
            Making the switch is straightforward. Here's how to get started.
          </p>
          <div className="max-w-3xl mx-auto">
            <div className="bg-secondary border border-border p-6">
              <div className="space-y-6">
                {competitor.switchingSteps.map((step, index) => (
                  <div key={step.title} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      <span className="font-sans text-sm text-foreground">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-sans text-sm text-foreground mb-1">
                        {step.title}
                      </h3>
                      <p className="font-sans text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mb-16 lg:mb-24">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* Where Midday is a Better Fit */}
        <section id="better-fit" className="scroll-mt-24 mb-16 lg:mb-24">
          <h2 className="font-serif text-2xl text-foreground mb-4 text-center">
            Where Midday is a better fit
          </h2>
          <p className="font-sans text-base text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
            Midday is the right choice if you're...
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="bg-secondary border border-border p-6">
              <div className="space-y-6">
                {competitor.targetAudience.map((audience) => (
                  <div key={audience} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-primary flex-shrink-0" />
                    <span className="font-sans text-sm text-foreground">
                      {audience}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mb-16 lg:mb-24">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* FAQ Section */}
        <section id="faq" className="scroll-mt-24 mb-16 lg:mb-24">
          <CompetitorFAQ competitor={competitor} />
        </section>

        {/* Divider */}
        <div className="mb-16 lg:mb-24">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* CTA Section */}
        <section className="text-center pb-24">
          <div className="bg-background border border-border p-8 lg:p-12 text-center relative before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-60deg,rgba(219,219,219,0.4),rgba(219,219,219,0.4)_1px,transparent_1px,transparent_6px)] dark:before:bg-[repeating-linear-gradient(-60deg,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_1px,transparent_1px,transparent_6px)] before:pointer-events-none">
            <div className="relative z-10">
              <h2 className="font-serif text-2xl text-foreground mb-4">
                Ready to make the switch?
              </h2>
              <p className="font-sans text-base text-muted-foreground mb-8 max-w-xl mx-auto">
                Start your 14-day free trial. No credit card required until
                you're ready to upgrade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="btn-inverse h-11 px-6">
                  <a href="https://app.midday.ai/">Start your free trial</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="bg-background h-11 px-6"
                >
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
