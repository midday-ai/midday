"use client";

import { Button } from "@midday/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";
import { TestimonialsSection } from "./sections/testimonials-section";

export function Download() {
  const [isDockLoaded, setIsDockLoaded] = useState(false);

  // Trigger animation after mount to handle cached images
  useEffect(() => {
    const timer = setTimeout(() => setIsDockLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible lg:min-h-screen lg:overflow-hidden">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col relative pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 overflow-hidden">
          <div className="flex flex-col justify-start items-center space-y-8 z-20 px-4 sm:px-6">
            {/* Dock Image */}
            <div className="flex justify-center w-full relative">
              <div className="w-full max-w-lg aspect-[2175/1193] relative">
                <Image
                  src="/images/dock-light.png"
                  alt="Mac Dock"
                  width={2175}
                  height={1193}
                  className="absolute inset-0 w-full h-full object-contain dark:hidden transition-all duration-1000 ease-in-out"
                  style={{
                    opacity: isDockLoaded ? 1 : 0,
                    filter: isDockLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isDockLoaded ? "scale(1)" : "scale(1.05)",
                  }}
                  priority
                />
                <Image
                  src="/images/dock-dark.png"
                  alt="Mac Dock"
                  width={2175}
                  height={1193}
                  className="absolute inset-0 w-full h-full object-contain hidden dark:block transition-all duration-1000 ease-in-out"
                  style={{
                    opacity: isDockLoaded ? 1 : 0,
                    filter: isDockLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isDockLoaded ? "scale(1)" : "scale(1.05)",
                  }}
                  priority
                />
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-4 text-center max-w-xl w-full">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
                Midday for Mac
              </h1>
              <p className="text-muted-foreground text-base leading-normal font-sans text-center mx-auto">
                Quick access to your financial files in a native Mac experience.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md mx-auto justify-center sm:justify-center">
              <a href="/api/download?platform=aarch64" download>
                <Button className="w-full sm:w-auto h-11 px-6 text-sm font-sans">
                  Apple Silicon
                </Button>
              </a>
              <a href="/api/download?platform=x64" download>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                >
                  Intel Macs
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative pt-40 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 z-20 px-4 pb-32">
            {/* Dock Image - Centered */}
            <div className="flex justify-center w-full relative">
              <div className="w-full max-w-xl aspect-[2175/1193] relative">
                <Image
                  src="/images/dock-light.png"
                  alt="Mac Dock"
                  width={2175}
                  height={1193}
                  className="absolute inset-0 w-full h-full object-contain dark:hidden transition-all duration-1000 ease-in-out"
                  style={{
                    opacity: isDockLoaded ? 1 : 0,
                    filter: isDockLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isDockLoaded ? "scale(1)" : "scale(1.05)",
                  }}
                  priority
                />
                <Image
                  src="/images/dock-dark.png"
                  alt="Mac Dock"
                  width={2175}
                  height={1193}
                  className="absolute inset-0 w-full h-full object-contain hidden dark:block transition-all duration-1000 ease-in-out"
                  style={{
                    opacity: isDockLoaded ? 1 : 0,
                    filter: isDockLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isDockLoaded ? "scale(1)" : "scale(1.05)",
                  }}
                  priority
                />
              </div>
            </div>

            {/* Title and Description */}
            <div className="text-center space-y-4 w-full">
              <h1 className="font-serif text-6xl xl:text-7xl 2xl:text-8xl leading-tight text-foreground">
                Midday for Mac
              </h1>
              <p className="text-muted-foreground text-sm xl:text-base leading-normal max-w-xl mx-auto font-sans text-center">
                Quick access to your financial files in a native Mac experience.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-6 justify-center">
              <a href="/api/download?platform=aarch64" download>
                <Button className="h-11 px-6 text-sm font-sans">
                  Apple Silicon
                </Button>
              </a>
              <a href="/api/download?platform=x64" download>
                <Button
                  variant="outline"
                  className="h-11 px-6 text-sm font-sans bg-background border-border hover:bg-accent"
                >
                  Intel Macs
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-background py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-stretch">
            {/* Left Feature - Native Performance */}
            <div className="flex flex-col gap-8 lg:gap-12 p-8 lg:p-10 flex-1">
              <div className="space-y-2 text-center">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                  Native performance
                </h2>
                <p className="font-sans text-base text-muted-foreground leading-normal">
                  Midday runs fast and light on Apple silicon, so everything
                  stays responsive and out of your way.
                </p>
              </div>

              {/* Apple Logo Image */}
              <div className="flex justify-center mt-auto">
                <div className="p-10 lg:p-14 bg-background relative min-h-[160px] min-w-[160px] lg:min-h-[224px] lg:min-w-[224px]">
                  <Image
                    src="/images/apple-light.png"
                    alt="Apple Logo"
                    width={300}
                    height={300}
                    className="w-40 h-40 lg:w-56 lg:h-56 object-contain dark:hidden"
                    priority
                  />
                  <Image
                    src="/images/apple-dark.png"
                    alt="Apple Logo"
                    width={300}
                    height={300}
                    className="w-40 h-40 lg:w-56 lg:h-56 object-contain hidden dark:block"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Vertical Divider - Desktop Only */}
            <div className="hidden lg:block w-px border-l border-border self-stretch" />

            {/* Horizontal Divider - Mobile Only */}
            <div className="lg:hidden h-px w-full border-t border-border my-8" />

            {/* Right Feature - Universal Search */}
            <div className="flex flex-col gap-8 lg:gap-12 p-8 lg:p-10 flex-1 lg:justify-between">
              <div className="space-y-2 text-center">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground">
                  Universal search anywhere
                </h2>
                <p className="font-sans text-base text-muted-foreground leading-normal">
                  Press <span className="text-foreground font-mono">⇧⌥K</span>{" "}
                  to search Midday from anywhere on your Mac. Instantly find
                  receipts, invoices, transactions, customers, and files.
                </p>
              </div>

              {/* Keyboard Image */}
              <div className="flex flex-1 justify-center lg:justify-end items-center lg:items-center min-h-[200px]">
                <div className="p-4 lg:p-6 bg-background w-full max-w-lg flex items-center justify-center relative aspect-[3/2]">
                  <Image
                    src="/images/keyboard-light.png"
                    alt="Keyboard Shortcut"
                    width={600}
                    height={400}
                    className="w-full h-full object-contain dark:hidden"
                    priority
                  />
                  <Image
                    src="/images/keyboard-dark.png"
                    alt="Keyboard Shortcut"
                    width={600}
                    height={400}
                    className="w-full h-full object-contain hidden dark:block"
                    priority
                  />
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
}
