"use client";

import { BulkReconciliationAnimation } from "@midday/ui/animations/bulk-reconciliation";
import { DashboardAnimation } from "@midday/ui/animations/dashboard";
import { InboxMatchAnimation } from "@midday/ui/animations/inbox-match";
import { TransactionFlowAnimation } from "@midday/ui/animations/transaction-flow";
import { Button } from "@midday/ui/button";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "./homepage/icon-mapping";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";

const howItWorksSteps = [
  {
    title: "Transactions collected automatically",
    subtitle:
      "Payments in and out are synced daily from connected bank accounts.",
  },
  {
    title: "Receipts and invoices matched",
    subtitle:
      "Documents are pulled from email, uploads, or folders and matched to the right transactions.",
  },
  {
    title: "Categories and tax applied",
    subtitle:
      "Transactions are categorized continuously, with tax and VAT stored where it belongs.",
  },
  {
    title: "Everything stays up to date",
    subtitle: "As new data comes in, your numbers stay reconciled and ready.",
  },
];

export function PreAccounting() {
  const [activeStep, setActiveStep] = useState(0);
  const [isLightLoaded, setIsLightLoaded] = useState(false);
  const [isDarkLoaded, setIsDarkLoaded] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible lg:min-h-screen lg:overflow-hidden">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 overflow-hidden">
          <div className="flex flex-col justify-start items-center space-y-8 z-20 px-4 sm:px-6">
            {/* Accounting Illustration */}
            <div className="flex justify-center w-full relative">
              <div className="h-[90px] sm:h-[110px] w-full flex items-center justify-center">
                <Image
                  src="/images/accounting-light.png"
                  alt="Accounting Interface"
                  width={112}
                  height={400}
                  className="h-full w-auto object-contain dark:hidden transition-all duration-700 ease-out"
                  style={{
                    filter: isLightLoaded ? "blur(0px)" : "blur(20px)",
                    transform: isLightLoaded ? "scale(1)" : "scale(1.02)",
                  }}
                  priority
                  onLoad={() => setIsLightLoaded(true)}
                />
                <Image
                  src="/images/accounting-dark.png"
                  alt="Accounting Interface"
                  width={112}
                  height={400}
                  className="h-full w-auto object-contain hidden dark:block transition-all duration-700 ease-out"
                  style={{
                    filter: isDarkLoaded ? "blur(0px)" : "blur(20px)",
                    transform: isDarkLoaded ? "scale(1)" : "scale(1.02)",
                  }}
                  priority
                  onLoad={() => setIsDarkLoaded(true)}
                />
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-4 text-center max-w-xl w-full pt-4">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
                Pre-accounting, handled.
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto">
                Midday collects, matches, and prepares your financial data so
                your books are always ready before they reach an accountant.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4 text-center w-full">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md mx-auto justify-center sm:justify-center">
                <Button
                  asChild
                  className="w-full sm:w-auto h-11 px-6 text-sm font-sans"
                >
                  <a href="https://app.midday.ai/">Start free trial</a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const element = document.getElementById("how-it-works");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                >
                  See how it works
                </Button>
              </div>
              <p className="text-muted-foreground text-xs font-sans">
                14-day free trial · Cancel anytime
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 z-20 px-4 pb-32">
            {/* Accounting Illustration - Centered */}
            <div className="flex justify-center w-full relative">
              <div className="h-[140px] w-full flex items-center justify-center">
                <Image
                  src="/images/accounting-light.png"
                  alt="Accounting Interface"
                  width={112}
                  height={400}
                  className="h-full w-auto object-contain dark:hidden transition-all duration-700 ease-out"
                  style={{
                    filter: isLightLoaded ? "blur(0px)" : "blur(20px)",
                    transform: isLightLoaded ? "scale(1)" : "scale(1.02)",
                  }}
                  priority
                  onLoad={() => setIsLightLoaded(true)}
                />
                <Image
                  src="/images/accounting-dark.png"
                  alt="Accounting Interface"
                  width={112}
                  height={400}
                  className="h-full w-auto object-contain hidden dark:block transition-all duration-700 ease-out"
                  style={{
                    filter: isDarkLoaded ? "blur(0px)" : "blur(20px)",
                    transform: isDarkLoaded ? "scale(1)" : "scale(1.02)",
                  }}
                  priority
                  onLoad={() => setIsDarkLoaded(true)}
                />
              </div>
            </div>

            {/* Title and Description */}
            <div className="text-center space-y-4 w-full pt-6">
              <h1 className="font-serif text-6xl xl:text-7xl 2xl:text-7xl leading-tight text-foreground">
                Pre-accounting, handled.
              </h1>
              <p className="text-muted-foreground text-sm xl:text-base leading-normal max-w-xl mx-auto font-sans text-center">
                Midday collects, matches, and prepares your financial data so
                your books are always ready before they reach an accountant.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-6 justify-center">
              <Button asChild className="h-11 px-6 text-sm font-sans">
                <a href="https://app.midday.ai/">Start free trial</a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const element = document.getElementById("how-it-works");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
              >
                See how it works
              </Button>
            </div>
            <p className="text-muted-foreground text-xs font-sans text-center">
              14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <section
        id="how-it-works"
        className="bg-background py-12 sm:py-16 lg:pt-32 lg:pb-24"
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Mobile: Stacked features with animations */}
          <div className="grid grid-cols-1 gap-12 sm:gap-16 lg:hidden">
            {howItWorksSteps.map((step, index) => (
              <div key={step.title} className="space-y-6 sm:space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-2xl sm:text-2xl text-foreground max-w-md mx-auto">
                    {step.title}
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-md mx-auto">
                    {step.subtitle}
                  </p>
                </div>
                <div className="w-full border border-border overflow-hidden p-1 sm:p-3 relative">
                  <div className="w-full h-[520px] sm:h-[620px] relative overflow-hidden flex items-center justify-center z-10">
                    <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                      {index === 0 ? (
                        <TransactionFlowAnimation onComplete={undefined} />
                      ) : index === 1 ? (
                        <InboxMatchAnimation onComplete={undefined} />
                      ) : index === 2 ? (
                        <TransactionFlowAnimation onComplete={undefined} />
                      ) : (
                        <DashboardAnimation onComplete={undefined} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Timeline animation */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 lg:h-[740px]">
            <div className="flex gap-6">
              {/* Timeline */}
              <div className="flex flex-col justify-center items-center flex-shrink-0 relative">
                <div className="flex flex-col justify-center space-y-5 lg:space-y-6 mt-2 lg:mt-3">
                  <div
                    className="flex items-center justify-center relative mb-4 lg:mb-6"
                    style={{ minHeight: "3rem" }}
                  />
                  {howItWorksSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex items-start justify-center relative"
                      style={{ minHeight: "3.5rem" }}
                    >
                      <button
                        onClick={() => setActiveStep(index)}
                        className="cursor-pointer relative z-10"
                        style={{ marginTop: "0.125rem" }}
                        type="button"
                        aria-label={`Go to step: ${step.title}`}
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-none transition-all duration-300 ${
                            activeStep === index
                              ? "bg-primary"
                              : "bg-border hover:bg-muted-foreground"
                          }`}
                          animate={{
                            scale: activeStep === index ? 1.2 : 1,
                          }}
                          transition={{
                            duration: 0.2,
                            ease: "easeOut",
                          }}
                        />
                      </button>
                      {index < howItWorksSteps.length - 1 && (
                        <div
                          className="absolute left-1/2 -translate-x-1/2 w-px border-l border-border"
                          style={{
                            height: "calc(3.5rem + 1.25rem - 0.25rem)",
                            top: "0.375rem",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Content */}
              <div className="flex flex-col justify-center space-y-5 lg:space-y-6 flex-1">
                <div
                  className="flex items-center mb-4 lg:mb-6"
                  style={{ minHeight: "3rem" }}
                >
                  <h2 className="font-serif text-2xl text-foreground">
                    Less time fixing. Less money wasted.
                  </h2>
                </div>
                {howItWorksSteps.map((step, index) => (
                  <button
                    type="button"
                    key={step.title}
                    className={`cursor-pointer transition-all duration-300 flex items-start bg-transparent border-0 p-0 text-left ${
                      activeStep === index
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-80"
                    }`}
                    onClick={() => setActiveStep(index)}
                    style={{ minHeight: "3rem" }}
                  >
                    {activeStep === index ? (
                      <motion.div
                        initial={{ opacity: 0, filter: "blur(6px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(6px)" }}
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden"
                      >
                        <h2 className="font-sans text-lg lg:text-xl text-primary transition-colors duration-300 max-w-md">
                          {step.title}
                        </h2>
                        <p className="font-sans text-sm text-primary leading-relaxed max-w-md mt-1">
                          {step.subtitle}
                        </p>
                      </motion.div>
                    ) : (
                      <div>
                        <h2 className="font-sans text-lg lg:text-xl text-muted-foreground transition-colors duration-300 max-w-md">
                          {step.title}
                        </h2>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center p-6 lg:p-8 border border-border h-full overflow-hidden relative bg-background">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center"
                style={{ transformOrigin: "center" }}
              >
                <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                  {activeStep === 0 ? (
                    <TransactionFlowAnimation onComplete={undefined} />
                  ) : activeStep === 1 ? (
                    <InboxMatchAnimation onComplete={undefined} />
                  ) : activeStep === 2 ? (
                    <TransactionFlowAnimation onComplete={undefined} />
                  ) : (
                    <DashboardAnimation onComplete={undefined} />
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Accountant handoff Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Accountant-ready, without the back and forth
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
              Midday prepares clean, structured records so exporting or syncing
              to your accounting system takes minutes, not days.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-3 justify-center mb-8 pt-2">
              <Link
                href="/integrations/fortnox"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
              >
                <Image
                  src="/images/fortnox.svg"
                  alt="Fortnox"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className="font-sans text-sm text-foreground">
                  Fortnox
                </span>
              </Link>
              <Link
                href="/integrations/xero"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
              >
                <Image
                  src="/images/xero.svg"
                  alt="Xero"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className="font-sans text-sm text-foreground">Xero</span>
              </Link>
              <Link
                href="/integrations/quickbooks"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
              >
                <Image
                  src="/images/quickbooks.svg"
                  alt="QuickBooks"
                  width={16}
                  height={16}
                  className="object-contain"
                />
                <span className="font-sans text-sm text-foreground">
                  QuickBooks
                </span>
              </Link>
            </div>
            <div className="bg-secondary border border-border p-6 relative">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    Transactions and attachments reviewed in one place
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    Clear "ready for export" state
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    No loose receipts or missing context
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name="check"
                      className="text-foreground"
                      size={14}
                    />
                  </div>
                  <span className="font-sans text-sm text-foreground">
                    Consistent categories and report codes
                  </span>
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

      {/* Receipts & documents Section */}
      <section className="bg-background py-12 sm:py-16 lg:pt-32 lg:pb-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
            <div className="flex items-center lg:order-2">
              <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                  Receipts matched automatically
                </h2>
                <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                  Invoices and receipts are collected from email, uploads, or
                  bulk drag-and-drop, scanned with OCR, and matched to the right
                  transactions. Missing receipts are surfaced automatically so
                  reconciliation doesn't pile up.
                </p>
                <div className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <Link
                      href="/integrations/gmail"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                    >
                      <Image
                        src="/images/gmail.svg"
                        alt="Gmail"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className="font-sans text-sm text-foreground">
                        Gmail
                      </span>
                    </Link>
                    <Link
                      href="/integrations/outlook"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                    >
                      <Image
                        src="/images/outlook.svg"
                        alt="Outlook"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className="font-sans text-sm text-foreground">
                        Outlook
                      </span>
                    </Link>
                    <Link
                      href="/integrations/slack"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                    >
                      <Image
                        src="/images/slack.svg"
                        alt="Slack"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className="font-sans text-sm text-foreground">
                        Slack
                      </span>
                    </Link>
                    <Link
                      href="/integrations/whatsapp"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors"
                    >
                      <Image
                        src="/images/whatsapp.svg"
                        alt="WhatsApp"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className="font-sans text-sm text-foreground">
                        WhatsApp
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Animation */}
            <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background lg:order-1">
              <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                  <BulkReconciliationAnimation onComplete={undefined} />
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

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
}
