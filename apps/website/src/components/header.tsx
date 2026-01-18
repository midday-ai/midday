"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeaderIntegrationsPreview } from "./header-integrations-preview";

interface HeaderProps {
  transparent?: boolean;
  hideMenuItems?: boolean;
}

// Feature pages to prefetch on hover
const FEATURE_ROUTES = [
  "/assistant",
  "/insights",
  "/transactions",
  "/inbox",
  "/time-tracking",
  "/invoicing",
  "/customers",
  "/file-storage",
  "/pre-accounting",
];

// App pages to prefetch on hover
const APP_ROUTES = ["/integrations", "/download", "/docs", "/mcp"];

export function Header({
  transparent = false,
  hideMenuItems = false,
}: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
  const [isMobileAppsOpen, setIsMobileAppsOpen] = useState(false);
  const [visibleIntegrations, setVisibleIntegrations] = useState<
    Array<{ id: number; key: string }>
  >([]);
  const [featuresDropdownHeight, setFeaturesDropdownHeight] = useState<
    number | null
  >(null);
  const featuresTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const integrationKeyCounterRef = useRef(0);
  const featuresListRef = useRef<HTMLDivElement>(null);
  const preAccountingRef = useRef<HTMLAnchorElement>(null);
  const appsListRef = useRef<HTMLDivElement>(null);
  const macAppRef = useRef<HTMLAnchorElement>(null);
  const integrationsAppRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const featuresPrefetched = useRef(false);
  const appsPrefetched = useRef(false);

  // Prefetch feature pages on hover (only once)
  const prefetchFeatures = useCallback(() => {
    if (featuresPrefetched.current) return;
    featuresPrefetched.current = true;
    for (const route of FEATURE_ROUTES) {
      router.prefetch(route);
    }
  }, [router]);

  // Prefetch app pages on hover (only once)
  const prefetchApps = useCallback(() => {
    if (appsPrefetched.current) return;
    appsPrefetched.current = true;
    for (const route of APP_ROUTES) {
      router.prefetch(route);
    }
  }, [router]);

  // All non-ERP integrations
  const allIntegrations = [
    { src: "/images/gmail.svg", alt: "Gmail" },
    { src: "/images/slack.svg", alt: "Slack" },
    { src: "/images/stripe.svg", alt: "Stripe" },
    { src: "/images/gdrive.svg", alt: "Google Drive" },
    { src: "/images/outlook.svg", alt: "Outlook" },
    { src: "/images/whatsapp.svg", alt: "WhatsApp" },
    { src: "/images/dropbox.svg", alt: "Dropbox" },
  ];

  // Initialize with 4 random integrations
  useEffect(() => {
    if (isAppsOpen && visibleIntegrations.length === 0) {
      const shuffled = [...allIntegrations.keys()].sort(
        () => Math.random() - 0.5,
      );
      setVisibleIntegrations(
        shuffled.slice(0, 4).map((idx) => ({
          id: idx,
          key: `init-${integrationKeyCounterRef.current++}`,
        })),
      );
    }
  }, [isAppsOpen]);

  // Randomly fade in/out individual logos
  useEffect(() => {
    if (!isAppsOpen || visibleIntegrations.length === 0) return;

    const interval = setInterval(
      () => {
        setVisibleIntegrations((current) => {
          // Randomly decide to replace one logo (70% chance)
          if (Math.random() < 0.7 && current.length === 4) {
            const indexToReplace = Math.floor(Math.random() * 4);
            const availableIndices = allIntegrations
              .map((_, i) => i)
              .filter((i) => !current.some((item) => item.id === i));

            if (availableIndices.length > 0) {
              const newIndex =
                availableIndices[
                  Math.floor(Math.random() * availableIndices.length)
                ];
              const newVisible = [...current];
              newVisible[indexToReplace] = {
                id: newIndex ?? 0,
                key: `change-${integrationKeyCounterRef.current++}`,
              };
              return newVisible;
            }
          }
          return current;
        });
      },
      1500 + Math.random() * 1000,
    ); // Random interval between 1.5-2.5 seconds

    return () => clearInterval(interval);
  }, [isAppsOpen, visibleIntegrations.length]);

  // Match Pre-accounting container height to features list and store height for apps dropdown
  useEffect(() => {
    if (isFeaturesOpen && featuresListRef.current) {
      // Get the full dropdown height including padding
      const featuresDropdown = featuresListRef.current.closest(
        "[data-features-dropdown]",
      ) as HTMLElement;
      const featuresHeight = featuresDropdown
        ? featuresDropdown.offsetHeight
        : featuresListRef.current.offsetHeight;
      setFeaturesDropdownHeight(featuresHeight);

      if (preAccountingRef.current) {
        preAccountingRef.current.style.height = `${featuresListRef.current.offsetHeight}px`;
      }
    }
  }, [isFeaturesOpen]);

  // Apps dropdown height matches Features dropdown (image containers are fixed at 442x277)

  useEffect(() => {
    return () => {
      if (featuresTimeoutRef.current) {
        clearTimeout(featuresTimeoutRef.current);
      }
      if (appsTimeoutRef.current) {
        clearTimeout(appsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Dark Overlay */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-40 transition-opacity duration-150 ${
          isFeaturesOpen || isAppsOpen
            ? "opacity-100 visible bg-black/40"
            : "opacity-0 invisible pointer-events-none"
        }`}
        style={{ top: "72px" }}
      />

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full">
        <div
          ref={headerRef}
          className={cn(
            "relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center justify-between xl:gap-6",
            isMenuOpen && "border-b border-border",
            !transparent && "backdrop-blur-md bg-background-semi-transparent",
            !transparent &&
              (isFeaturesOpen || isAppsOpen) &&
              "xl:bg-background",
          )}
        >
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 active:opacity-80 transition-opacity duration-200 touch-manipulation"
            onClick={() => setIsMenuOpen(false)}
            style={{ WebkitTapHighlightColor: "transparent" }}
            aria-label="Midday - Go to homepage"
          >
            <div className="w-6 h-6">
              <Icons.LogoSmall className="w-full h-full text-foreground" />
            </div>
            <span className="font-sans text-base xl:hidden text-foreground">
              midday
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {!hideMenuItems && (
            <div className="hidden xl:flex items-center gap-6">
              {/* Features with Dropdown */}
              <div
                className="relative -mx-3 -my-2"
                onMouseEnter={() => {
                  if (featuresTimeoutRef.current) {
                    clearTimeout(featuresTimeoutRef.current);
                  }
                  prefetchFeatures();
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
                  className="text-sm transition-colors text-muted-foreground hover:text-foreground px-3 py-2"
                >
                  Features
                </button>
                {/* Invisible bridge to dropdown */}
                {isFeaturesOpen && (
                  <div
                    className="absolute left-0 right-0 h-4"
                    style={{ top: "100%" }}
                  />
                )}

                {/* Features Dropdown - Full Width */}
                {isFeaturesOpen && (
                  <div
                    data-features-dropdown
                    className="fixed left-0 right-0 bg-background border-t border-b border-border shadow-lg z-50 overflow-hidden opacity-0 animate-dropdown-fade"
                    style={{ top: "100%" }}
                  >
                    <div className="p-6 xl:p-8 2xl:p-10">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                        {/* Column 1 & 2 - Features List (2 columns) */}
                        <div
                          className="lg:col-span-2 xl:max-w-xl 2xl:max-w-xl"
                          ref={featuresListRef}
                        >
                          <div className="grid grid-cols-2 gap-x-4">
                            {/* Column 1 */}
                            <div>
                              {[
                                {
                                  href: "/assistant",
                                  title: "Assistant",
                                  desc: "Ask questions and get clear financial answers",
                                },
                                {
                                  href: "/insights",
                                  title: "Insights",
                                  desc: "See what's changing",
                                },
                                {
                                  href: "/transactions",
                                  title: "Transactions",
                                  desc: "All transactions together",
                                },
                                {
                                  href: "/inbox",
                                  title: "Inbox",
                                  desc: "Receipts handled automatically",
                                },
                              ].map((item, index) => (
                                <div
                                  key={item.href}
                                  className="opacity-0 animate-dropdown-slide"
                                  style={{ animationDelay: `${index * 30}ms` }}
                                >
                                  <Link
                                    href={item.href}
                                    className="flex items-center py-3 group hover:bg-secondary transition-colors duration-200"
                                    onClick={() => setIsFeaturesOpen(false)}
                                  >
                                    <div className="flex flex-col pl-2">
                                      <span className="font-sans text-base text-foreground mb-1">
                                        {item.title}
                                      </span>
                                      <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                        {item.desc}
                                      </span>
                                    </div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                            {/* Column 2 */}
                            <div>
                              {[
                                {
                                  href: "/time-tracking",
                                  title: "Time tracking",
                                  desc: "See where time goes",
                                },
                                {
                                  href: "/invoicing",
                                  title: "Invoicing",
                                  desc: "Get paid faster",
                                },
                                {
                                  href: "/customers",
                                  title: "Customers",
                                  desc: "Know your customers",
                                },
                                {
                                  href: "/file-storage",
                                  title: "Files",
                                  desc: "Everything in one place",
                                },
                              ].map((item, index) => (
                                <div
                                  key={item.href}
                                  className="opacity-0 animate-dropdown-slide"
                                  style={{
                                    animationDelay: `${(index + 4) * 30}ms`,
                                  }}
                                >
                                  <Link
                                    href={item.href}
                                    className="flex items-center py-3 group hover:bg-secondary transition-colors duration-200"
                                    onClick={() => setIsFeaturesOpen(false)}
                                  >
                                    <div className="flex flex-col pl-2">
                                      <span className="font-sans text-base text-foreground mb-1">
                                        {item.title}
                                      </span>
                                      <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                        {item.desc}
                                      </span>
                                    </div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Column 3 & 4 - Pre-accounting Preview */}
                        <div className="lg:col-span-2 flex items-start justify-end">
                          <Link
                            ref={preAccountingRef}
                            href="/pre-accounting"
                            onClick={() => setIsFeaturesOpen(false)}
                            className="w-[400px] h-[277px] border border-border overflow-hidden cursor-pointer hover:opacity-90 hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200 flex flex-col"
                          >
                            <div className="flex-1 flex items-center justify-center bg-background p-4">
                              <Image
                                src="/images/accounting-light.png"
                                alt="Pre-accounting"
                                width={112}
                                height={400}
                                className="h-auto w-auto max-h-[80px] object-contain dark:hidden"
                              />
                              <Image
                                src="/images/accounting-dark.png"
                                alt="Pre-accounting"
                                width={112}
                                height={400}
                                className="h-auto w-auto max-h-[80px] object-contain hidden dark:block"
                              />
                            </div>
                            <div className="bg-background border-t border-border p-2.5 flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <span className="font-sans text-xs text-foreground block">
                                  Pre-accounting
                                </span>
                                <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                  Clean records ready for your accountant
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div className="w-6 h-6 border border-border flex items-center justify-center bg-background">
                                  <Image
                                    src="/images/xero.svg"
                                    alt="Xero"
                                    width={14}
                                    height={14}
                                    className="object-contain opacity-70"
                                  />
                                </div>
                                <div className="w-6 h-6 border border-border flex items-center justify-center bg-background">
                                  <Image
                                    src="/images/quickbooks.svg"
                                    alt="QuickBooks"
                                    width={14}
                                    height={14}
                                    className="object-contain opacity-70"
                                  />
                                </div>
                                <div className="w-6 h-6 border border-border flex items-center justify-center bg-background">
                                  <Image
                                    src="/images/fortnox.svg"
                                    alt="Fortnox"
                                    width={14}
                                    height={14}
                                    className="object-contain opacity-70"
                                  />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Apps with Dropdown */}
              <div
                className="relative -mx-3 -my-2"
                onMouseEnter={() => {
                  if (appsTimeoutRef.current) {
                    clearTimeout(appsTimeoutRef.current);
                  }
                  prefetchApps();
                  setIsAppsOpen(true);
                }}
                onMouseLeave={() => {
                  appsTimeoutRef.current = setTimeout(() => {
                    setIsAppsOpen(false);
                  }, 200);
                }}
              >
                <button
                  type="button"
                  className="text-sm transition-colors text-muted-foreground hover:text-foreground px-3 py-2"
                >
                  Apps
                </button>
                {/* Invisible bridge to dropdown */}
                {isAppsOpen && (
                  <div
                    className="absolute left-0 right-0 h-4"
                    style={{ top: "100%" }}
                  />
                )}

                {/* Apps Dropdown - Full Width */}
                {isAppsOpen && (
                  <div
                    className="fixed left-0 right-0 bg-background border-t border-b border-border shadow-lg z-50 overflow-hidden opacity-0 animate-dropdown-fade"
                    style={{
                      top: "100%",
                      height:
                        featuresDropdownHeight !== null
                          ? `${featuresDropdownHeight}px`
                          : "auto",
                    }}
                  >
                    <div className="p-6 xl:p-8 2xl:p-10 h-full">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6 items-start h-full">
                        {/* Column 1 & 2 - Apps List (2 columns) */}
                        <div
                          ref={appsListRef}
                          className="lg:col-span-2 lg:max-w-md xl:max-w-lg 2xl:max-w-xl"
                        >
                          <div className="grid grid-cols-2 gap-x-4">
                            {/* Column 1 */}
                            <div>
                              {[
                                {
                                  href: "/download",
                                  title: "Mac app",
                                  desc: "Your finances, always one click away.",
                                  external: false,
                                },
                                {
                                  href: "/integrations",
                                  title: "Integrations",
                                  desc: "Connect your existing tools.",
                                  external: false,
                                },
                                {
                                  href: "/docs",
                                  title: "Documentation",
                                  desc: "Learn how to use Midday.",
                                  external: false,
                                },
                              ].map((item, index) => (
                                <div
                                  key={item.href}
                                  className="opacity-0 animate-dropdown-slide"
                                  style={{ animationDelay: `${index * 30}ms` }}
                                >
                                  <Link
                                    href={item.href}
                                    className="flex items-center py-3 group hover:bg-secondary transition-colors duration-200"
                                    onClick={() => setIsAppsOpen(false)}
                                  >
                                    <div className="flex flex-col pl-2">
                                      <span className="font-sans text-base text-foreground mb-1">
                                        {item.title}
                                      </span>
                                      <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                        {item.desc}
                                      </span>
                                    </div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                            {/* Column 2 */}
                            <div>
                              {[
                                {
                                  href: "/mcp",
                                  title: "MCP Server",
                                  desc: "Connect AI tools to your financial data.",
                                  external: false,
                                },
                                {
                                  href: "https://api.midday.ai",
                                  title: "Developer & API",
                                  desc: "Programmatic access to Midday.",
                                  external: true,
                                },
                                {
                                  href: "/sdks",
                                  title: "SDKs",
                                  desc: "Typed SDKs to build faster.",
                                  external: false,
                                },
                              ].map((item, index) => (
                                <div
                                  key={`${item.href}-${item.title}`}
                                  className="opacity-0 animate-dropdown-slide"
                                  style={{
                                    animationDelay: `${(index + 2) * 30}ms`,
                                  }}
                                >
                                  {item.external ? (
                                    <a
                                      href={item.href}
                                      className="flex items-center py-3 group hover:bg-secondary transition-colors duration-200"
                                      onClick={() => setIsAppsOpen(false)}
                                    >
                                      <div className="flex flex-col pl-2">
                                        <span className="font-sans text-base text-foreground mb-1">
                                          {item.title}
                                        </span>
                                        <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                          {item.desc}
                                        </span>
                                      </div>
                                    </a>
                                  ) : (
                                    <Link
                                      href={item.href}
                                      className="flex items-center py-3 group hover:bg-secondary transition-colors duration-200"
                                      onClick={() => setIsAppsOpen(false)}
                                    >
                                      <div className="flex flex-col pl-2">
                                        <span className="font-sans text-base text-foreground mb-1">
                                          {item.title}
                                        </span>
                                        <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                          {item.desc}
                                        </span>
                                      </div>
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Columns 3 & 4 - Image Previews Container */}
                        <div className="lg:col-span-2 flex items-start justify-end gap-4 flex-nowrap">
                          {/* Integrations Preview */}
                          <Link
                            ref={integrationsAppRef}
                            href="/integrations"
                            onClick={() => setIsAppsOpen(false)}
                            className="w-full max-w-[320px] lg:w-[320px] lg:max-w-none xl:w-[350px] 2xl:w-[400px] h-[277px] border border-border overflow-hidden cursor-pointer hover:opacity-90 hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200 flex flex-col flex-shrink-0"
                          >
                            <div className="flex-1">
                              <HeaderIntegrationsPreview />
                            </div>
                            <div className="bg-background border-t border-border p-2.5 flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <span className="font-sans text-xs text-foreground block">
                                  Integrations
                                </span>
                                <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                  Connect your existing tools.
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 relative h-6">
                                {visibleIntegrations.map((item) => (
                                  <div
                                    key={item.key}
                                    className="w-6 h-6 border border-border flex items-center justify-center bg-background transition-all duration-300"
                                  >
                                    <Image
                                      src={allIntegrations[item.id]?.src ?? ""}
                                      alt={allIntegrations[item.id]?.alt ?? ""}
                                      width={14}
                                      height={14}
                                      className="object-contain opacity-70"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Link>

                          {/* Mac App Preview */}
                          <Link
                            ref={macAppRef}
                            href="/download"
                            onClick={() => setIsAppsOpen(false)}
                            className="w-full max-w-[320px] lg:w-[320px] lg:max-w-none xl:w-[350px] 2xl:w-[400px] h-[277px] border border-border overflow-hidden cursor-pointer hover:opacity-90 hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200 flex flex-col flex-shrink-0"
                          >
                            <div className="flex-1 flex items-center justify-center bg-background p-4">
                              <Image
                                src="/images/header-dock-light.png"
                                alt="Mac Dock"
                                width={1200}
                                height={300}
                                className="w-3/4 h-auto object-contain dark:hidden"
                              />
                              <Image
                                src="/images/header-dock-dark.png"
                                alt="Mac Dock"
                                width={1200}
                                height={300}
                                className="w-3/4 h-auto object-contain hidden dark:block"
                              />
                            </div>
                            <div className="bg-background border-t border-border p-2.5">
                              <span className="font-sans text-xs text-foreground block">
                                Mac app
                              </span>
                              <span className="font-sans text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                Your finances, always one click away.
                              </span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign in */}
              <div className="border-l border-border pl-4">
                <Link
                  href="https://app.midday.ai/"
                  className="text-sm transition-colors text-primary hover:text-primary/80"
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
              className="transition-colors flex items-center justify-end p-2 min-w-[44px] min-h-[44px] text-foreground hover:text-foreground xl:active:text-foreground focus:outline-none focus-visible:outline-none touch-manipulation"
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
          <div className="pt-28 px-6">
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
                  className="text-2xl font-sans transition-colors py-2 text-primary hover:text-primary xl:active:text-primary focus:outline-none focus-visible:outline-none touch-manipulation flex items-center justify-between"
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
                    <div className="overflow-hidden opacity-0 animate-mobile-slide">
                      <div className="flex flex-col space-y-4 pt-2">
                        <Link
                          href="/assistant"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Assistant
                        </Link>
                        <Link
                          href="/insights"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Insights
                        </Link>
                        <Link
                          href="/transactions"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Transactions
                        </Link>
                        <Link
                          href="/inbox"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Inbox
                        </Link>
                        <Link
                          href="/time-tracking"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Time tracking
                        </Link>
                        <Link
                          href="/invoicing"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Invoicing
                        </Link>
                        <Link
                          href="/customers"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Customers
                        </Link>
                        <Link
                          href="/file-storage"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileFeaturesOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Files
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Link
                href="/pricing"
                onTouchEnd={(e) => {
                  const target = e.currentTarget;
                  if (target) {
                    target.blur();
                    setTimeout(() => {
                      if (target) {
                        target.blur();
                      }
                    }, 100);
                  }
                }}
                className="no-touch-active text-2xl font-sans transition-colors py-2 text-primary hover:text-primary xl:active:text-primary focus:outline-none focus-visible:outline-none touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Pricing
              </Link>
              <Link
                href="/updates"
                onTouchEnd={(e) => {
                  const target = e.currentTarget;
                  if (target) {
                    target.blur();
                    setTimeout(() => {
                      if (target) {
                        target.blur();
                      }
                    }, 100);
                  }
                }}
                className="no-touch-active text-2xl font-sans transition-colors py-2 text-primary hover:text-primary xl:active:text-primary focus:outline-none focus-visible:outline-none touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Updates
              </Link>
              <Link
                href="/story"
                onTouchEnd={(e) => {
                  const target = e.currentTarget;
                  if (target) {
                    target.blur();
                    setTimeout(() => {
                      if (target) {
                        target.blur();
                      }
                    }, 100);
                  }
                }}
                className="no-touch-active text-2xl font-sans transition-colors py-2 text-primary hover:text-primary xl:active:text-primary focus:outline-none focus-visible:outline-none touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Story
              </Link>

              {/* Apps Expandable Section */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMobileAppsOpen(!isMobileAppsOpen);
                    e.currentTarget.blur();
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.blur();
                  }}
                  className="text-2xl font-sans transition-colors py-2 text-primary hover:text-primary xl:active:text-primary focus:outline-none focus-visible:outline-none touch-manipulation flex items-center justify-between"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span>Apps</span>
                  <Icons.ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isMobileAppsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isMobileAppsOpen && (
                  <>
                    <div className="h-px w-full border-t border-border my-2" />
                    <div className="overflow-hidden opacity-0 animate-mobile-slide">
                      <div className="flex flex-col space-y-4 pt-2">
                        <Link
                          href="/download"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileAppsOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Mac app
                        </Link>
                        <Link
                          href="/integrations"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileAppsOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Integrations
                        </Link>
                        <Link
                          href="/docs"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileAppsOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Documentation
                        </Link>
                        <Link
                          href="/mcp"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileAppsOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          MCP Server
                        </Link>
                        <a
                          href="https://api.midday.ai"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileAppsOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          Developer & API
                        </a>
                        <Link
                          href="/sdks"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileAppsOpen(false);
                          }}
                          className="text-lg font-sans text-left text-muted-foreground hover:text-muted-foreground xl:active:text-muted-foreground focus:outline-none focus-visible:outline-none touch-manipulation transition-colors"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          SDKs
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sign in */}
              <div className="border-t border-border pt-8 mt-8">
                <Link
                  href="https://app.midday.ai/"
                  onTouchEnd={(e) => {
                    const target = e.currentTarget;
                    if (target) {
                      target.blur();
                      setTimeout(() => {
                        if (target) {
                          target.blur();
                        }
                      }, 100);
                    }
                  }}
                  className="text-2xl font-sans transition-colors py-2 text-primary hover:text-primary xl:active:text-primary focus:outline-none focus-visible:outline-none touch-manipulation"
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
