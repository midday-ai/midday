"use client";

import { cn } from "@midday/ui/cn";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background relative overflow-hidden">
      {/* Top Divider - Full Bleed */}
      <div className="h-px w-full border-t border-border" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-16 sm:pb-80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-16">
          {/* Left Column - Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-16 lg:col-span-1">
            <div className="space-y-2">
              <h3 className="font-sans text-sm text-foreground mb-4">
                Product
              </h3>
              <div className="space-y-2">
                <Link
                  href="/pricing"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Pricing
                </Link>
                <Link
                  href="/download"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Download
                </Link>
                <Link
                  href="/bank-coverage/"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Bank coverage
                </Link>
                <Link
                  href="/pre-accounting"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Pre-accounting
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-sans text-sm text-foreground mb-4">
                Company
              </h3>
              <div className="space-y-2">
                <Link
                  href="/story"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Story
                </Link>
                <Link
                  href="/updates"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Updates
                </Link>
                <Link
                  href="/roadmap"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Roadmap
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-sans text-sm text-foreground mb-4">
                Resources
              </h3>
              <div className="space-y-2">
                <Link
                  href="/support"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Support
                </Link>
                <Link
                  href="/privacy"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="font-sans text-sm text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors block"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Text and Compliance Images */}
          <div className="flex flex-col items-start lg:items-end gap-6 lg:gap-10">
            <p className="font-sans text-base sm:text-xl text-foreground text-left lg:text-right">
              Business finances that explain themselves.
            </p>

            {/* Compliance Section */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9">
                  <Image
                    src="/images/gdpr.png"
                    alt="GDPR Compliant"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="font-sans text-xs text-foreground">GDPR</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Compliant
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9">
                  <Image
                    src="/images/soc2.png"
                    alt="SOC2 In Progress"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="font-sans text-xs text-foreground">Soc2</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    In progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-16">
          <div className="h-px w-full border-t border-border" />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="https://midday.openstatus.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 justify-start hover:opacity-80 transition-opacity"
          >
            <span className="font-sans text-sm text-muted-foreground">
              System status:
            </span>
            <span className="font-sans text-sm text-foreground">
              Operational
            </span>
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full relative z-10" />
              <div 
                className="absolute w-2 h-2 bg-green-500 rounded-full"
                style={{
                  animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  willChange: 'transform, opacity, box-shadow',
                }}
              />
            </div>
          </Link>
          <p className="font-sans text-sm text-muted-foreground text-left sm:text-right">
            © {new Date().getFullYear()} Midday Labs AB. All rights reserved.
          </p>
        </div>
      </div>

      {/* Large Wordmark */}
      <div className="absolute bottom-0 left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 translate-y-[25%] sm:translate-y-[40%] bg-background overflow-hidden">
        <h1
          className={cn(
            "font-sans text-[200px] sm:text-[508px] leading-none select-none",
            "text-secondary",
            "[WebkitTextStroke:1px_hsl(var(--muted-foreground))]",
            "[textStroke:1px_hsl(var(--muted-foreground))]",
          )}
          style={{
            WebkitTextStroke: "1px hsl(var(--muted-foreground))",
            color: "hsl(var(--secondary))",
          }}
        >
          midday
        </h1>
      </div>
    </footer>
  );
}
