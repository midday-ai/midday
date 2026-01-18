"use client";

import { Button } from "@midday/ui/button";

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
        <div className="flex flex-col lg:flex-row gap-14 justify-center items-center lg:items-stretch max-w-6xl mx-auto">
          {/* Starter */}
          <div className="flex-1 max-w-md w-full lg:w-auto">
            <div className="bg-background backdrop-blur-[43px] border border-border p-4 py-6 h-full flex flex-col">
              <div className="mb-4">
                <h3 className="font-sans text-base text-foreground mb-1">
                  Starter
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-3">
                  For solo founders who want a clean starting point for their
                  business finances
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    $29
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
                    Receipts and file storage
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Invoicing (up to 10 invoices per month)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Time tracking
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
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-background border border-border text-foreground font-sans text-sm py-3 px-4 hover:bg-muted transition-colors"
                >
                  <a href="https://app.midday.ai/">Start your trial</a>
                </Button>
                <p className="font-sans text-xs text-muted-foreground text-center">
                  Best for getting started
                </p>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="flex-1 max-w-md w-full lg:w-auto">
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
                  For founders and small teams running weekly finance workflows
                  end to end
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    $49
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
                    Receipts and file storage
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Invoicing (up to 50 invoices per month)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Time tracking
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
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full btn-inverse font-sans text-sm py-3 px-4 transition-colors"
                >
                  <a href="https://app.midday.ai/">Start your trial</a>
                </Button>
                <p className="font-sans text-xs text-muted-foreground text-center">
                  Best value for most businesses
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 space-y-1">
          <p className="font-sans text-xs text-muted-foreground">
            14-day free trial · Cancel anytime
          </p>
          <p className="font-sans text-xs text-muted-foreground">
            Prices shown in USD. Local taxes may apply.
          </p>
        </div>
      </div>
    </section>
  );
}
