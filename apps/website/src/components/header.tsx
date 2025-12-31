"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeaderAssistantInputPreview } from "./header-assistant-input-preview";
import { HeaderInsightsPreview } from "./header-insights-preview";

interface HeaderProps {
  transparent?: boolean;
  hideMenuItems?: boolean;
}

export function Header({
  transparent = false,
  hideMenuItems = false,
}: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
  const featuresTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (featuresTimeoutRef.current) {
        clearTimeout(featuresTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Dark Overlay */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-40 transition-opacity duration-150 ${
          isFeaturesOpen
            ? "opacity-100 visible bg-black/40"
            : "opacity-0 invisible pointer-events-none"
        }`}
        style={{ top: "72px" }}
      />

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full">
        <div
          className={cn(
            transparent
              ? "bg-transparent"
              : "bg-background/95 backdrop-blur-md",
            "py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center justify-between xl:gap-6",
            isMenuOpen && "border-b border-border",
          )}
        >
          {/* Logo and Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 active:opacity-80 transition-opacity duration-200 touch-manipulation"
            onClick={() => router.push("/")}
            style={{ WebkitTapHighlightColor: "transparent" }}
            onTouchEnd={(e) => e.currentTarget.blur()}
          >
            <div className="w-6 h-6">
              <Icons.LogoSmall className="w-full h-full text-foreground" />
            </div>
            <span className="font-sans text-base xl:hidden text-foreground">
              midday
            </span>
          </div>

          {/* Desktop Navigation Links */}
          {!hideMenuItems && (
            <div className="hidden xl:flex items-center gap-6">
              {/* Features with Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  if (featuresTimeoutRef.current) {
                    clearTimeout(featuresTimeoutRef.current);
                  }
                  setIsFeaturesOpen(true);
                }}
                onMouseLeave={() => {
                  featuresTimeoutRef.current = setTimeout(() => {
                    setIsFeaturesOpen(false);
                  }, 200);
                }}
              >
                <button
                  type="button"
                  className="text-sm transition-colors text-muted-foreground hover:text-foreground"
                >
                  Features
                </button>


                {/* Features Dropdown - Full Width */}
                <div
                  className={`fixed left-0 right-0 bg-background border-t border-b border-border shadow-lg z-50 overflow-hidden transition-opacity duration-150 ${
                    isFeaturesOpen
                      ? "opacity-100 visible"
                      : "opacity-0 invisible"
                  }`}
                  style={{ top: "100%" }}
                >
                  <div className="pt-4 pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-10">
                      {/* Left Column - Features List */}
                      <div className="lg:col-span-3 px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6 2xl:px-8">
                        {/* Features Eyebrow */}
                        <div className="mb-2">
                          <span className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                            Features
                          </span>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer rounded group"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/assistant");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Assistant
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              Ask questions and get clear financial answers
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer rounded group"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/insights");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Insights
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              See what's changing
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer rounded group"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/transactions");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Transactions
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              All transactions together
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer rounded group"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/inbox");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Inbox
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              Receipts handled automatically
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer rounded group"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/time-tracking");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Time tracking
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              See where time goes
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer rounded group"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/invoicing");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Invoicing
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              Get paid faster
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer group rounded"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/customers");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Customers
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              Know your customers
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center py-2 cursor-pointer group rounded"
                          onClick={() => {
                            setIsFeaturesOpen(false);
                            router.push("/file-storage");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-sans text-base text-foreground">
                              Files
                            </span>
                            <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                              Everything in one place
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Preview */}
                      <div className="lg:col-span-7 flex items-start justify-center lg:pl-8 lg:pt-6">
                        <div className="w-full max-w-4xl h-full">
                          <div className="rounded h-full">
                            <div className="grid grid-cols-2 gap-6 h-full">
                              {/* Left Preview */}
                              <div className="flex flex-col gap-6 h-full">
                                <div className="flex-1 border border-border overflow-hidden">
                                  <HeaderAssistantInputPreview />
                                </div>
                                <div className="text-left">
                                  <h3 className="font-sans text-sm text-foreground mb-1">
                                    Assistant
                                  </h3>
                                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                                    Ask questions and get clear financial
                                    answers
                                  </p>
                                </div>
                              </div>

                              {/* Right Preview */}
                              <div className="flex flex-col gap-6 h-full">
                                <div className="flex-1 border border-border overflow-hidden">
                                  <HeaderInsightsPreview />
                                </div>
                                <div className="text-left">
                                  <h3 className="font-sans text-sm text-foreground mb-1">
                                    Insights
                                  </h3>
                                  <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                                    Weekly summaries that show what changed and why
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/pricing"
                className="text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="/updates"
                className="text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                Updates
              </Link>
              <Link
                href="/story"
                className="text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                Story
              </Link>
              <Link
                href="/download"
                className="text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                Download
              </Link>

              {/* Sign in */}
              <div className="border-l border-border pl-4">
                <Link
                  href="/login"
                  className="text-sm transition-colors text-foreground hover:text-muted-foreground"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Mobile & Tablet Hamburger Menu */}
          <div className="xl:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="transition-colors flex items-center justify-end p-2 min-w-[44px] min-h-[44px] text-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation"
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isMenuOpen ? (
                <Icons.Close className="w-5 h-5" />
              ) : (
                <Icons.Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile & Tablet Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden bg-background">
          <div className="pt-32 px-6">
            <div className="flex flex-col space-y-6 text-left">
              {/* Features Expandable Section */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMobileFeaturesOpen(!isMobileFeaturesOpen);
                    e.currentTarget.blur();
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.blur();
                  }}
                  className="text-2xl font-sans transition-colors py-2 text-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation flex items-center justify-between"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span>Features</span>
                  <Icons.ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isMobileFeaturesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isMobileFeaturesOpen && (
                  <>
                    <div className="h-px w-full border-t border-border my-2" />
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col space-y-4 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/assistant");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Assistant
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/insights");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Insights
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/transactions");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Transactions
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/inbox");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Inbox
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/time-tracking");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Time tracking
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/invoicing");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Invoicing
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/customers");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Customers
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push("/file-storage");
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.blur();
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Files
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
              <Link
                href="/pricing"
                onTouchEnd={(e) => {
                  e.currentTarget.blur();
                  setTimeout(() => e.currentTarget.blur(), 100);
                }}
                className="no-touch-active text-2xl font-sans transition-colors py-2 text-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Pricing
              </Link>
              <Link
                href="/updates"
                onTouchEnd={(e) => {
                  e.currentTarget.blur();
                  setTimeout(() => e.currentTarget.blur(), 100);
                }}
                className="no-touch-active text-2xl font-sans transition-colors py-2 text-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Updates
              </Link>
              <Link
                href="/story"
                onTouchEnd={(e) => {
                  e.currentTarget.blur();
                  setTimeout(() => e.currentTarget.blur(), 100);
                }}
                className="no-touch-active text-2xl font-sans transition-colors py-2 text-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Story
              </Link>
              <Link
                href="/download"
                onTouchEnd={(e) => {
                  e.currentTarget.blur();
                  setTimeout(() => e.currentTarget.blur(), 100);
                }}
                className="text-2xl font-sans py-2 text-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Download
              </Link>

              {/* Sign in - highlighted */}
              <div className="border-t border-border pt-8 mt-8">
                <Link
                  href="/login"
                  onTouchEnd={(e) => {
                    e.currentTarget.blur();
                    setTimeout(() => e.currentTarget.blur(), 100);
                  }}
                  className="text-2xl font-sans transition-colors py-2 text-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
