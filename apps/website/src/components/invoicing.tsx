"use client";

import { InvoicePaymentAnimation } from "@midday/ui/animations/invoice-payment";
import { InvoicePromptAnimation } from "@midday/ui/animations/invoice-prompt";
import Image from "next/image";
import Link from "next/link";
import { HeroImage } from "./hero-image";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { IntegrationsSection } from "./sections/integrations-section";
import { PreAccountingSection } from "./sections/pre-accounting-section";
import { PricingSection } from "./sections/pricing-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { TimeSavingsSection } from "./sections/time-savings-section";

export function Invoicing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible lg:min-h-screen lg:overflow-hidden">
        {/* Grid Pattern Background - Desktop Only */}
        <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
          <Image
            src="/images/grid-light.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-100 dark:opacity-[12%] dark:hidden"
            loading="lazy"
          />
          <Image
            src="/images/grid-dark.svg"
            alt="Grid Pattern"
            width={1728}
            height={1080}
            className="w-[1728px] h-screen object-cover opacity-[12%] hidden dark:block"
            loading="lazy"
          />
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-8 sm:pt-40 sm:pb-8 md:pt-48 overflow-hidden">
          {/* Grid Pattern Background - Mobile/Tablet Only (Limited Height) */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-0"
            style={{ height: "600px" }}
          >
            <Image
              src="/images/grid-light.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-100 dark:opacity-[12%] dark:hidden"
              loading="lazy"
            />
            <Image
              src="/images/grid-dark.svg"
              alt="Grid Pattern"
              width={1728}
              height={1080}
              className="w-full h-[600px] object-cover opacity-[12%] hidden dark:block"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-start items-center space-y-6 z-20 px-3 sm:px-4">
            <div className="space-y-4 text-center max-w-xl px-2 w-full">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                Invoicing
              </p>
              <h1 className="font-serif text-4xl sm:text-4xl md:text-5xl leading-tight">
                <span className="text-foreground">Get paid faster</span>
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto lg:hidden">
                Create and send invoices and track their status.
              </p>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto hidden lg:block">
                Create invoices, send them to customers, and track payments
                while every update flows directly into your financial overview.
              </p>
            </div>

            {/* Invoicing Illustration */}
            <div className="flex justify-center w-full">
              <div className="relative w-full max-w-6xl">
                <div
                  className="absolute bottom-0 left-0 right-0 h-[20%] z-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 20%, hsla(var(--background), 0.8) 40%, hsla(var(--background), 0.5) 60%, hsla(var(--background), 0.2) 80%, transparent 100%)",
                  }}
                />
                <HeroImage
                  lightSrc="/images/invoicing-light.svg"
                  darkSrc="/images/invoicing-dark.svg"
                  alt="Invoicing Interface"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-start items-center space-y-12 z-20 px-4 pt-16">
            {/* Main Heading */}
            <div className="text-center space-y-8 2xl:space-y-12 3xl:space-y-12 w-full">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                Invoicing
              </p>
              <h1 className="font-serif text-8xl xl:text-9xl 2xl:text-[11rem] leading-tight text-center">
                <span className="text-foreground block">Get paid faster</span>
              </h1>

              <p className="text-muted-foreground text-base leading-normal max-w-2xl mx-auto font-sans text-center">
                Create invoices, send them to customers, and track payments
                while every update flows directly into your financial overview.
              </p>
            </div>

            {/* Invoicing Illustration */}
            <div className="flex justify-center w-full">
              <div className="relative w-full max-w-6xl">
                <div
                  className="absolute bottom-0 left-0 right-0 h-[20%] z-10 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 20%, hsla(var(--background), 0.8) 40%, hsla(var(--background), 0.5) 60%, hsla(var(--background), 0.2) 80%, transparent 100%)",
                  }}
                />
                <HeroImage
                  lightSrc="/images/invoicing-light.svg"
                  darkSrc="/images/invoicing-dark.svg"
                  alt="Invoicing Interface"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight Feature Section with Animations */}
      <section className="bg-background py-12 sm:py-16 lg:pt-32 lg:pb-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="space-y-16 sm:space-y-20 lg:space-y-32">
            {/* First Animation - Invoice Creation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center">
                <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Flexible invoicing setup
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    Create one-off, recurring, scheduled, or web invoices
                    depending on how you bill your customers.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        One-off invoices
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Recurring invoices
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Scheduled invoices
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Web invoices
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Invoice templates
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Animation */}
              <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <InvoicePromptAnimation onComplete={undefined} />
                  </div>
                </div>
              </div>
            </div>

            {/* Second Animation - Payment Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center lg:order-2">
                <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Connected to your finances
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    Invoices stay linked to customers and revenue, with fast
                    online payments built in.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Invoice status tracking
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Overdue reminders
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Payment tracking
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Revenue per customer
                      </span>
                    </div>
                    <Link
                      href="/integrations/stripe-payments"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                    >
                      <Image
                        src="/images/stripe.svg"
                        alt="Stripe"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className="font-sans text-sm text-foreground">
                        Stripe
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right: Animation */}
              <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background lg:order-1">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <InvoicePaymentAnimation onComplete={undefined} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Features Grid Section */}
      <FeaturesGridSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Time Savings Section */}
      <TimeSavingsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Accounting Section */}
      <PreAccountingSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
}
