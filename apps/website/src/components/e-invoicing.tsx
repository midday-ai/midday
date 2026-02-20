"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroImage } from "./hero-image";
import { EInvoiceFlowAnimation } from "./homepage/e-invoice-flow-animation";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";

// ---------------------------------------------------------------------------
// Country data for the supported-countries marquee
// ---------------------------------------------------------------------------

const countries = [
  { code: "BE", name: "Belgium" },
  { code: "NL", name: "Netherlands" },
  { code: "LU", name: "Luxembourg" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "AT", name: "Austria" },
  { code: "IE", name: "Ireland" },
  { code: "PL", name: "Poland" },
  { code: "NO", name: "Norway" },
  { code: "SE", name: "Sweden" },
  { code: "FI", name: "Finland" },
  { code: "DK", name: "Denmark" },
  { code: "IS", name: "Iceland" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "CZ", name: "Czech Republic" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "HR", name: "Croatia" },
  { code: "RO", name: "Romania" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "GB", name: "United Kingdom" },
  { code: "GR", name: "Greece" },
  { code: "CH", name: "Switzerland" },
];

const COUNTRY_ROW_COUNT = 4;
const countryRowSize = Math.ceil(countries.length / COUNTRY_ROW_COUNT);
const countryRows = Array.from({ length: COUNTRY_ROW_COUNT }, (_, rowIndex) =>
  countries.slice(rowIndex * countryRowSize, (rowIndex + 1) * countryRowSize),
).filter((row) => row.length > 0);

// ---------------------------------------------------------------------------
// FAQ sub-component
// ---------------------------------------------------------------------------

interface FAQItem {
  question: string;
  answer: string;
}

function EInvoicingFAQ({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Frequently asked questions
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
            Everything you need to know about e-invoicing.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="border border-border bg-background"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-muted/50 transition-colors"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span className="font-sans text-sm text-foreground pr-6">
                  {faq.question}
                </span>
                <span className="flex-shrink-0 text-muted-foreground text-base">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EInvoicing({ faqs }: { faqs: FAQItem[] }) {
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
          {/* Grid Pattern Background - Mobile/Tablet Only */}
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
                E-Invoicing
              </p>
              <h1 className="font-serif text-4xl sm:text-4xl md:text-5xl leading-tight">
                <span className="text-foreground">E-invoicing, built in</span>
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto">
                Send and receive compliant e-invoices via the Peppol network.
                Built into your workflow — no extra tools needed.
              </p>
            </div>

            {/* Hero Image */}
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
                  alt="E-Invoicing Interface"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-start items-center space-y-12 z-20 px-4 pt-16">
            <div className="text-center space-y-8 2xl:space-y-12 3xl:space-y-12 w-full">
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider">
                E-Invoicing
              </p>
              <h1 className="font-serif text-8xl xl:text-9xl 2xl:text-[11rem] leading-tight text-center">
                <span className="text-foreground block">E-invoicing,</span>
                <span className="text-foreground block">built in</span>
              </h1>

              <p className="text-muted-foreground text-base leading-normal max-w-2xl mx-auto font-sans text-center">
                Send and receive compliant e-invoices via the Peppol network in
                30+ countries. Built into your invoicing workflow — no extra
                tools, no compliance headaches.
              </p>
            </div>

            {/* Hero Image */}
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
                  alt="E-Invoicing Interface"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works + Send & Receive Sections */}
      <section className="bg-background py-12 sm:py-16 lg:pt-32 lg:pb-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="space-y-16 sm:space-y-20 lg:space-y-32">
            {/* How it works */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              <div className="flex items-center">
                <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    E-invoicing that just works
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    Set up once, then send compliant e-invoices as part of your
                    normal workflow. Midday handles validation, format
                    conversion, and delivery through the Peppol network behind
                    the scenes.
                  </p>

                  <div className="space-y-4 pt-4 max-w-lg mx-auto lg:mx-0">
                    {[
                      {
                        step: "1",
                        title: "Add your company details",
                        desc: "Address, VAT number, and country in Settings",
                      },
                      {
                        step: "2",
                        title: "Register for Peppol",
                        desc: "One-time setup with identity verification",
                      },
                      {
                        step: "3",
                        title: "Send invoices as usual",
                        desc: "E-invoices are delivered automatically when your customer has a Peppol ID",
                      },
                      {
                        step: "4",
                        title: "Receive e-invoices",
                        desc: "Incoming e-invoices arrive in your inbox with data pre-extracted",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full border border-border bg-secondary flex items-center justify-center">
                          <span className="text-xs text-foreground font-medium">
                            {item.step}
                          </span>
                        </div>
                        <div>
                          <p className="font-sans text-sm text-foreground leading-tight">
                            {item.title}
                          </p>
                          <p className="font-sans text-sm text-muted-foreground leading-normal">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <Link
                      href="https://app.midday.ai"
                      className="inline-flex items-center justify-center h-9 px-5 font-sans text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                    >
                      Get started
                    </Link>
                  </div>
                </div>
              </div>

              {/* Animation */}
              <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center">
                  <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                    <EInvoiceFlowAnimation onCompleteAction={undefined} />
                  </div>
                </div>
              </div>
            </div>

            {/* Send and receive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-stretch">
              {/* Left: Title and Subtitle */}
              <div className="flex items-center lg:order-2">
                <div className="space-y-3 lg:space-y-5 text-center lg:text-left w-full">
                  <h2 className="font-sans text-2xl sm:text-2xl text-foreground">
                    Send and receive, any invoice type
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto lg:mx-0">
                    E-invoicing works with every invoice type — one-off,
                    recurring, and scheduled. When your customer has a Peppol
                    ID, compliant delivery happens automatically. Incoming
                    e-invoices arrive in your inbox with structured data,
                    matched to transactions by AI.
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
                        Automatic validation
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        UBL 3.0 format
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        Structured data extraction
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background">
                      <span className="font-sans text-sm text-foreground">
                        No OCR needed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Visual — incoming flow */}
              <div className="flex items-center justify-center p-1 sm:p-3 lg:p-6 xl:p-8 border border-border overflow-hidden relative bg-background lg:order-1">
                <div className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex flex-col justify-center gap-0 px-4 md:px-6">
                  {/* Step 1: Incoming */}
                  <div className="w-full border border-border bg-background p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full border border-border bg-secondary flex items-center justify-center">
                        <span className="text-[10px] text-foreground font-medium">
                          1
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Received via Peppol
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-foreground">
                        INV-2026-091
                      </div>
                      <div className="text-xs text-foreground">
                        SEK 18,500.00
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[11px] text-muted-foreground">
                        Acme Industries AB
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        SE556012345601
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex justify-center">
                    <div className="w-px h-5 bg-border" />
                  </div>

                  {/* Step 2: Extracted */}
                  <div className="w-full border border-border bg-background p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full border border-border bg-secondary flex items-center justify-center">
                        <span className="text-[10px] text-foreground font-medium">
                          2
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Data extracted
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          Supplier
                        </div>
                        <div className="text-xs text-foreground">
                          Acme Industries AB
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          Amount
                        </div>
                        <div className="text-xs text-foreground">
                          SEK 18,500.00
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          Date
                        </div>
                        <div className="text-xs text-foreground">
                          2026-02-10
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          VAT
                        </div>
                        <div className="text-xs text-foreground">
                          SEK 3,700.00
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="flex justify-center">
                    <div className="w-px h-5 bg-border" />
                  </div>

                  {/* Step 3: Matched */}
                  <div className="w-full border border-border bg-background p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full border border-border bg-secondary flex items-center justify-center">
                        <span className="text-[10px] text-foreground font-medium">
                          3
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Matched to transaction
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground font-medium">
                            AI
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-foreground">
                            Acme Industries AB
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Bank transfer · Feb 12
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[11px] text-muted-foreground">
                          Matched
                        </span>
                      </div>
                    </div>
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

      {/* Supported Countries Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-10 sm:mb-12">
            <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
              Peppol network — 30+ countries
            </h2>
            <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
              Send compliant e-invoices to any registered Peppol participant
              worldwide. Adoption is growing across Europe, Asia-Pacific, and
              beyond — including countries where e-invoicing is already
              mandatory.
            </p>
          </div>

          {/* Country marquee */}
          <div
            className="relative w-full max-w-4xl mx-auto space-y-2 overflow-hidden"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          >
            {countryRows.map((row, rowIndex) => {
              const marqueeClass =
                rowIndex % 2 === 0
                  ? "animate-marquee-left"
                  : "animate-marquee-right";

              return (
                <div
                  key={`country-row-${rowIndex}`}
                  className="relative flex w-full max-w-full overflow-hidden"
                  style={{ contain: "paint" }}
                >
                  <div
                    className={`flex min-w-full ${marqueeClass} will-change-transform`}
                    style={{ animationDuration: `${34 + rowIndex * 4}s` }}
                  >
                    <div className="flex gap-2 shrink-0 pr-2">
                      {row.map((country) => (
                        <div
                          key={country.code}
                          className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-background whitespace-nowrap"
                          title={country.name}
                        >
                          <span className="text-[11px] text-foreground">
                            {country.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      className="flex gap-2 shrink-0 pr-2"
                      aria-hidden="true"
                    >
                      {row.map((country) => (
                        <div
                          key={`dup-${country.code}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-background whitespace-nowrap"
                          title={country.name}
                        >
                          <span className="text-[11px] text-foreground">
                            {country.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* FAQ Section */}
      <EInvoicingFAQ faqs={faqs} />

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
