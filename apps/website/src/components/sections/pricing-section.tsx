"use client";

import { Button } from "@midday/ui/button";
import Link from "next/link";

export function PricingSection() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Pricing that matches how you run your business
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal">
            Start simple, upgrade when your workflow gets more complex.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-center lg:items-stretch max-w-7xl mx-auto px-4">
          {/* Starter */}
          <div className="flex-1 max-w-sm w-full lg:w-auto">
            <div className="bg-background backdrop-blur-[43px] border border-border p-4 py-6 h-full flex flex-col">
              <div className="mb-4">
                <h3 className="font-sans text-base text-foreground mb-1">
                  Starter
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-3">
                  For solo operators getting started with portfolio management
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    $499
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-1 border-t border-border pt-6 pb-6">
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Financial overview and widgets
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Weekly summaries and insights
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Transactions with categorization
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Up to 10 invoices per month
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Up to 2 connected banks
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Up to 2 team members
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    10GB storage
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors"
                >
                  <a href="https://app.abacuslabs.co/">Start your trial</a>
                </Button>
                <p className="font-sans text-xs text-muted-foreground text-center">
                  Best for getting started
                </p>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="flex-1 max-w-sm w-full lg:w-auto">
            <div className="bg-background backdrop-blur-[43px] border border-primary p-4 py-6 h-full flex flex-col relative">
              <div className="absolute top-0 right-4 -translate-y-1/2">
                <div className="bg-background border border-primary px-2 py-1 rounded-full flex items-center justify-center">
                  <span className="font-sans text-xs text-foreground">
                    Most popular
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="font-sans text-base text-foreground mb-1">
                  Pro
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-3">
                  For growing teams running weekly finance workflows end to end
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    $599
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-1 border-t border-border pt-6 pb-6">
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Everything in Starter, plus:
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Up to 50 invoices per month
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Up to 10 connected banks
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Up to 10 team members
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    100GB storage
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    500 inbox items per month
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full btn-inverse font-sans text-sm py-3 px-4 transition-colors"
                >
                  <a href="https://app.abacuslabs.co/">Start your trial</a>
                </Button>
                <p className="font-sans text-xs text-muted-foreground text-center">
                  Best value for most businesses
                </p>
              </div>
            </div>
          </div>

          {/* Pro Plus */}
          <div className="flex-1 max-w-sm w-full lg:w-auto">
            <div className="bg-background backdrop-blur-[43px] border border-border p-4 py-6 h-full flex flex-col">
              <div className="mb-4">
                <h3 className="font-sans text-base text-foreground mb-1">
                  Pro Plus
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-3">
                  For scaling operations with unlimited access and advanced tools
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    $899
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-1 border-t border-border pt-6 pb-6">
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Everything in Pro, plus:
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Unlimited invoices
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Unlimited connected banks
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Unlimited team members
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    1TB storage
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Unlimited inbox items
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Underwriting tools
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors"
                >
                  <a href="https://app.abacuslabs.co/">Start your trial</a>
                </Button>
                <p className="font-sans text-xs text-muted-foreground text-center">
                  Best for scaling operations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Program */}
        <div className="max-w-2xl mx-auto mt-14">
          <div className="bg-background backdrop-blur-[43px] border border-border p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <h3 className="font-sans text-base text-foreground">
                  Launch Program
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md">
                  Want us to handle everything? We'll migrate your data, set up
                  your dashboard, and train your team — all in 30 days.
                </p>
                <p className="font-sans text-sm text-foreground">
                  Custom pricing
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-background border border-border text-foreground font-sans text-sm py-3 px-6 hover:bg-muted transition-colors"
                >
                  <Link href="/launch-program">Learn more</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 space-y-1">
          <p className="font-sans text-xs text-muted-foreground">
            30-day free trial · Cancel anytime
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Prices shown in USD. Local taxes may apply.
          </p>
        </div>
      </div>
    </section>
  );
}
