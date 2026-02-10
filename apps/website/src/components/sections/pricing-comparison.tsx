"use client";

import { Button } from "@midday/ui/button";
import type { Competitor } from "@/data/competitors";

interface Props {
  competitor: Competitor;
}

export function PricingComparison({ competitor }: Props) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-4 text-center">
        Pricing comparison
      </h2>
      <p className="font-sans text-base text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
        Transparent pricing without surprises.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Midday Pricing */}
        <div>
          <h3 className="font-sans text-lg text-foreground mb-6 text-center">
            Midday
          </h3>
          <div className="space-y-4">
            {competitor.pricing.midday.map((tier, index) => (
              <div
                key={tier.name}
                className={`border p-6 ${
                  index === 1 ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <h4 className="font-sans text-base text-foreground">
                    {tier.name}
                  </h4>
                  <div className="text-right">
                    <span className="font-sans text-2xl text-foreground">
                      {tier.price}
                    </span>
                    <span className="font-sans text-sm text-muted-foreground">
                      {tier.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-primary leading-[1.5rem]">•</span>
                      <span className="font-sans text-sm text-primary">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button asChild className="btn-inverse h-10 px-6">
              <a href="https://app.midday.ai/">Start free trial</a>
            </Button>
            <p className="font-sans text-xs text-muted-foreground mt-2">
              14-day free trial. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Competitor Pricing */}
        <div>
          <h3 className="font-sans text-lg text-muted-foreground mb-6 text-center">
            {competitor.name}
          </h3>
          <div className="space-y-4">
            {competitor.pricing.competitor.map((tier) => (
              <div
                key={tier.name}
                className="border border-border p-6 opacity-75"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <h4 className="font-sans text-base text-muted-foreground">
                    {tier.name}
                  </h4>
                  <div className="text-right">
                    <span className="font-sans text-2xl text-muted-foreground">
                      {tier.price}
                    </span>
                    <span className="font-sans text-sm text-muted-foreground">
                      {tier.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-muted-foreground leading-[1.5rem]">
                        •
                      </span>
                      <span className="font-sans text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {competitor.pricing.competitorNote && (
            <p className="font-sans text-xs text-muted-foreground mt-4 text-center">
              {competitor.pricing.competitorNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
