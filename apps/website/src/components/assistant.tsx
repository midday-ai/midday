"use client";

import { AssistantQuestionAnimation } from "@midday/ui/animations/assistant-question";
import { DashboardAnimation } from "@midday/ui/animations/dashboard";
import Image from "next/image";
import { useTheme } from "next-themes";
import { HeroImage } from "./hero-image";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { IntegrationsSection } from "./sections/integrations-section";
import { PreAccountingSection } from "./sections/pre-accounting-section";
import { PricingSection } from "./sections/pricing-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { TimeSavingsSection } from "./sections/time-savings-section";

export function Assistant() {
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme !== "dark";

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
                Assistant
              </p>
              <h1 className="font-serif text-4xl sm:text-4xl md:text-5xl leading-tight">
                <span className="text-foreground">Get clear answers</span>
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto lg:hidden">
                Ask questions and get clear answers from your business data.
              </p>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto hidden lg:block">
                Ask questions about your business and get clear, contextual
                answers based on your real data, including revenue, expenses,
                cash flow, and recent changes.
              </p>
            </div>

            {/* Assistant Illustration */}
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
                  lightSrc="/images/assistant-light.svg"
                  darkSrc="/images/assistant-dark.svg"
                  alt="Assistant Interface"
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
                Assistant
              </p>
              <h1 className="font-serif text-8xl xl:text-9xl 2xl:text-[11rem] leading-tight text-center">
                <span className="text-foreground block">Get clear answers</span>
              </h1>

              <p className="text-muted-foreground text-base leading-normal max-w-2xl mx-auto font-sans text-center">
                Ask questions about your business and get clear, contextual
                answers based on your real data, including revenue, expenses,
                cash flow, and recent changes.
              </p>
            </div>

            {/* Assistant Illustration */}
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
                  lightSrc="/images/assistant-light.svg"
                  darkSrc="/images/assistant-dark.svg"
                  alt="Assistant Interface"
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
            {/* First Animation - AI Assistant */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center">
                <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Ask questions and generate reports
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    Ask questions about revenue, expenses, cash flow, customers,
                    and changes over time, and generate reports, summaries, and
                    breakdowns based on your actual business data.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Natural language questions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Financial summaries
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Visual reports and charts
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Forecasts and runway
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        PDF export
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Animation */}
              <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <AssistantQuestionAnimation
                      onComplete={undefined}
                      isLightMode={isLightMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Second Animation - Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center lg:order-2">
                <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Answers with full context
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    The assistant understands your transactions, invoices,
                    customers, projects, and files so answers are specific to
                    your business, not generic outputs.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Transactions context
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Invoices context
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Customers context
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Projects context
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Files and receipts context
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Animation */}
              <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background lg:order-1">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <DashboardAnimation onComplete={undefined} />
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
