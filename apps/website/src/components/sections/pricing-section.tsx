"use client";

import { Button } from "@midday/ui/button";
import { useState } from "react";

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "yearly",
  );

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

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8 sm:mb-8 lg:mb-16">
          <div
            className="relative flex items-stretch bg-muted"
            style={{ width: "fit-content" }}
          >
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                  billingPeriod === "monthly"
                    ? "text-foreground bg-background border-border"
                    : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  marginBottom: billingPeriod === "monthly" ? "-1px" : "0px",
                  position: "relative",
                  zIndex: billingPeriod === "monthly" ? 10 : 1,
                }}
              >
                <span>Monthly</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 h-9 text-[14px] whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                  billingPeriod === "yearly"
                    ? "text-foreground bg-background border-border"
                    : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
                }`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  marginBottom: billingPeriod === "yearly" ? "-1px" : "0px",
                  position: "relative",
                  zIndex: billingPeriod === "yearly" ? 10 : 1,
                }}
              >
                <span>Yearly (Save 20%)</span>
              </button>
            </div>
          </div>
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
                  For founders running their business solo
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    {billingPeriod === "monthly" ? "$29" : "$23"}
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="font-sans text-xs text-muted-foreground mt-1">
                  {billingPeriod === "monthly"
                    ? "Billed monthly"
                    : "Billed yearly"}
                </p>
              </div>

              <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Invoicing with recurring and online payments
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Automatic bank sync and categorization
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Receipt capture via Gmail, Outlook, or upload
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Financial reports, burn rate, and tax summaries
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    AI assistant for financial insights
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Time tracking and project billing
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Multi-currency support
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Export to Xero, QuickBooks, or Fortnox
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    3 banks · 15 invoices · 10GB storage
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
                  For small teams that need more room to grow
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-2xl text-foreground">
                    {billingPeriod === "monthly" ? "$49" : "$39"}
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="font-sans text-xs text-muted-foreground mt-1">
                  {billingPeriod === "monthly"
                    ? "Billed monthly"
                    : "Billed yearly"}
                </p>
              </div>

              <div className="flex-1 space-y-1 border-t border-border pt-8 pb-6">
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Everything in Starter
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    10 banks · 50 invoices · 100GB storage
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
                    API access and integrations
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Shareable report links
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground leading-[1.5rem]">•</span>
                  <span className="font-sans text-sm text-foreground leading-relaxed">
                    Priority support
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
