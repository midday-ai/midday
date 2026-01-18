"use client";

import { Button } from "@midday/ui/button";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Dynamic imports for animations (5,500+ lines - loaded after hero)
const AIAssistantAnimation = dynamic(() =>
  import("./homepage/ai-assistant-animation").then(
    (m) => m.AIAssistantAnimation,
  ),
);
const DashboardAnimation = dynamic(() =>
  import("./homepage/dashboard-animation").then((m) => m.DashboardAnimation),
);
const InboxMatchAnimation = dynamic(() =>
  import("./homepage/inbox-match-animation").then((m) => m.InboxMatchAnimation),
);
const InvoicePaymentAnimation = dynamic(() =>
  import("./homepage/invoice-payment-animation").then(
    (m) => m.InvoicePaymentAnimation,
  ),
);
const TransactionFlowAnimation = dynamic(() =>
  import("./homepage/transaction-flow-animation").then(
    (m) => m.TransactionFlowAnimation,
  ),
);

// Dynamic imports for below-the-fold sections (still SSR for SEO)
const FeaturesGridSection = dynamic(() =>
  import("./sections/features-grid-section").then((m) => m.FeaturesGridSection),
);
const TimeSavingsSection = dynamic(() =>
  import("./sections/time-savings-section").then((m) => m.TimeSavingsSection),
);
const WeeklyAudioSection = dynamic(() =>
  import("./sections/weekly-audio-section").then((m) => m.WeeklyAudioSection),
);
const PreAccountingSection = dynamic(() =>
  import("./sections/pre-accounting-section").then(
    (m) => m.PreAccountingSection,
  ),
);
const TestimonialsSection = dynamic(
  () =>
    import("./sections/testimonials-section").then(
      (m) => m.TestimonialsSection,
    ),
  { ssr: false }, // MorphingDialog generates dynamic IDs that cause hydration mismatch
);
const IntegrationsSection = dynamic(() =>
  import("./sections/integrations-section").then((m) => m.IntegrationsSection),
);
const PricingSection = dynamic(() =>
  import("./sections/pricing-section").then((m) => m.PricingSection),
);

export function StartPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isMobileVideoLoaded, setIsMobileVideoLoaded] = useState(false);
  const [isDesktopVideoLoaded, setIsDesktopVideoLoaded] = useState(false);
  const [isMobilePosterLoaded, setIsMobilePosterLoaded] = useState(false);
  const [isDesktopPosterLoaded, setIsDesktopPosterLoaded] = useState(false);

  const videoContainerRef = useRef(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);

  // Handle mobile video load
  useEffect(() => {
    const video = mobileVideoRef.current;
    if (!video) return;

    const handleLoad = () => setIsMobileVideoLoaded(true);

    if (video.readyState >= 3) {
      setIsMobileVideoLoaded(true);
    }

    video.addEventListener("canplay", handleLoad);
    video.addEventListener("loadeddata", handleLoad);

    return () => {
      video.removeEventListener("canplay", handleLoad);
      video.removeEventListener("loadeddata", handleLoad);
    };
  }, []);

  // Handle desktop video load
  useEffect(() => {
    const video = desktopVideoRef.current;
    if (!video) return;

    const handleLoad = () => setIsDesktopVideoLoaded(true);

    if (video.readyState >= 3) {
      setIsDesktopVideoLoaded(true);
    }

    video.addEventListener("canplay", handleLoad);
    video.addEventListener("loadeddata", handleLoad);

    return () => {
      video.removeEventListener("canplay", handleLoad);
      video.removeEventListener("loadeddata", handleLoad);
    };
  }, []);

  const features = [
    {
      title: "All transactions in one place",
      subtitle:
        "Every payment in and out of the business is automatically synced from your connected accounts.",
      mobileSubtitle: "Every payment in and out is pulled in automatically.",
      mergedText:
        "All transactions in one place. Every payment in and out of the business is automatically synced from your connected accounts.",
      illustration: "animation",
    },
    {
      title: "Invoices get paid",
      subtitle:
        "Customers can pay invoices online, with payments flowing straight into your finances.",
      mobileSubtitle:
        "Customers can pay invoices online with payments flowing straight into your finances.",
      mergedText:
        "Invoices get paid. Customers can pay invoices online, with payments flowing straight into your finances.",
      illustration: "animation",
    },
    {
      title: "Reconciliation gets handled",
      subtitle:
        "Payments, receipts, and transactions are automatically matched so records stay accurate.",
      mobileSubtitle:
        "Transactions are categorized and reconciled automatically.",
      mergedText:
        "Reconciliation gets handled. Payments, receipts, and transactions are automatically matched so records stay accurate.",
      illustration: "animation",
    },
    {
      title: "Understand what's happening",
      subtitle:
        "Midday explains changes in cash, revenue, and spending as they happen.",
      mobileSubtitle: "See what's changing and why.",
      mergedText:
        "Understand what's happening. Midday explains changes in cash, revenue, and spending as they happen.",
      illustration: "animation",
    },
    {
      title: "Stay updated and in control",
      subtitle:
        "Weekly summaries and notifications keep you on top without constant checking.",
      mobileSubtitle: "Weekly summaries keep you up to date.",
      mergedText:
        "Stay updated and in control. Weekly summaries and notifications keep you on top without constant checking.",
      illustration: "animation",
    },
  ];

  const agentTags: Array<{ label: string; icon: string }> = [
    { label: "Insights-agent", icon: "insights" },
    { label: "Inbox-agent", icon: "inbox" },
    { label: "Invoice-agent", icon: "description" },
    { label: "Files-agent", icon: "folder_zip" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative min-h-screen overflow-visible lg:overflow-hidden">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col min-h-screen relative pt-32 pb-12 sm:py-32 md:pt-24 overflow-hidden">
          <div className="flex-1 flex flex-col justify-center md:justify-start md:pt-16 items-center space-y-8 z-20 px-3 sm:px-4">
            <div className="space-y-4 text-center max-w-xl px-2">
              <h1 className="font-serif text-3xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-2xl 2xl:text-2xl leading-tight">
                <span className="text-foreground">
                  Run your business finances without manual work.
                </span>
              </h1>

              <p className="text-muted-foreground text-base leading-normal font-sans max-w-md text-center mx-auto lg:text-left lg:mx-0">
                One place for transactions, receipts, invoices and everything
                around it.
              </p>
            </div>

            <div className="space-y-4 text-center w-full">
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                <Button
                  asChild
                  className="w-full btn-inverse h-11 px-5 transition-colors"
                >
                  <a href="https://app.midday.ai/">
                    <span className="text-inherit text-sm">
                      Set up your business
                    </span>
                  </a>
                </Button>
              </div>

              <p className="text-muted-foreground text-xs font-sans">
                14-day free trial · Cancel anytime
              </p>
            </div>
          </div>

          <div className="mt-8 mb-8 md:mt-12 overflow-visible">
            <div className="relative overflow-hidden">
              {/* Poster image with fade and blur effect */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out z-[1] ${
                  isMobileVideoLoaded
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
                style={{
                  filter: isMobileVideoLoaded ? "blur(0px)" : "blur(1px)",
                }}
              >
                <Image
                  src="https://cdn.midday.ai/video-poster-v2.jpg"
                  alt="Midday dashboard preview"
                  fill
                  className="object-cover transition-all duration-1000 ease-in-out"
                  style={{
                    filter: isMobilePosterLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isMobilePosterLoaded
                      ? "scale(1)"
                      : "scale(1.05)",
                  }}
                  priority
                  onLoad={() => setIsMobilePosterLoaded(true)}
                />
              </div>

              <video
                ref={mobileVideoRef}
                className={`w-full h-[420px] sm:h-[520px] md:h-[600px] object-cover transition-opacity duration-1000 ease-in-out ${
                  isMobileVideoLoaded ? "opacity-100" : "opacity-0"
                }`}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source
                  src="https://cdn.midday.ai/videos/login-video.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 flex items-center justify-center p-0 z-[2]">
                <div className="relative scale-[0.95] md:scale-100">
                  <Image
                    src="/images/dashboard-light.svg"
                    alt="Dashboard illustration"
                    width={1000}
                    height={750}
                    className="w-full h-auto md:!scale-[0.85] dark:hidden"
                    priority
                  />
                  <Image
                    src="/images/dashboard-dark.svg"
                    alt="Dashboard illustration"
                    width={1000}
                    height={750}
                    className="w-full h-auto md:!scale-[0.85] hidden dark:block"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-col min-h-screen relative">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="pt-56 mb-16 3xl:mb-16">
              <div className="flex justify-between items-end">
                <div className="max-w-xl">
                  <div className="space-y-3">
                    <h1 className="font-serif text-xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3] text-left">
                      <span className="text-foreground">
                        Run your business finances without manual work.
                      </span>
                    </h1>
                    <p className="font-sans text-base text-muted-foreground leading-normal text-left">
                      One place for transactions, receipts, invoices and
                      everything around it.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      asChild
                      className="btn-inverse h-11 px-4 transition-colors w-full sm:w-auto"
                    >
                      <a href="https://app.midday.ai/">
                        <span className="text-inherit text-sm">
                          Set up your business
                        </span>
                      </a>
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="text-muted-foreground text-xs font-sans">
                      14-day free trial. Cancel anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="w-full mb-4 3xl:mb-20 relative"
            ref={videoContainerRef}
          >
            <div className="relative overflow-hidden">
              {/* Poster image with fade and blur effect */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out z-[1] ${
                  isDesktopVideoLoaded
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
                style={{
                  filter: isDesktopVideoLoaded ? "blur(0px)" : "blur(1px)",
                }}
              >
                <Image
                  src="https://cdn.midday.ai/video-poster-v2.jpg"
                  alt="Midday dashboard preview"
                  fill
                  className="object-cover transition-all duration-1000 ease-in-out"
                  style={{
                    filter: isDesktopPosterLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isDesktopPosterLoaded
                      ? "scale(1)"
                      : "scale(1.05)",
                  }}
                  priority
                  onLoad={() => setIsDesktopPosterLoaded(true)}
                />
              </div>

              <video
                ref={desktopVideoRef}
                className={`w-full h-[800px] xl:h-[900px] 3xl:h-[1000px] object-cover block transition-opacity duration-1000 ease-in-out ${
                  isDesktopVideoLoaded ? "opacity-100" : "opacity-0"
                }`}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source
                  src="https://cdn.midday.ai/videos/login-video.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 p-4 z-[2]">
                <div className="h-full flex flex-col items-center justify-center">
                  <Image
                    src="/images/dashboard-light.svg"
                    alt="Dashboard illustration"
                    width={1600}
                    height={1200}
                    className="w-full h-auto object-contain max-w-[85%] 2xl:max-w-[66%] dark:hidden"
                    style={{
                      transform: "rotate(-2deg) skew-y-1",
                      filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
                    }}
                    priority
                  />
                  <Image
                    src="/images/dashboard-dark.svg"
                    alt="Dashboard illustration"
                    width={1600}
                    height={1200}
                    className="w-full h-auto object-contain max-w-[85%] 2xl:max-w-[66%] hidden dark:block"
                    style={{
                      transform: "rotate(-2deg) skew-y-1",
                      filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
                    }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features 2-Column Layout Section */}
      <section className="bg-background pt-12 sm:pt-16 lg:pt-24 3xl:pt-32 pb-20 lg:pb-24">
        <div className="max-w-[1400px] mx-auto">
          {/* Mobile: Stacked features */}
          <div className="grid grid-cols-1 gap-12 sm:gap-16 lg:hidden">
            <div className="hidden lg:block text-center mb-2">
              <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
                How it works
              </h2>
            </div>
            {features.map((feature, index) => (
              <div key={index} className="space-y-6 sm:space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-2xl sm:text-2xl text-foreground max-w-md mx-auto">
                    {feature.title}
                  </h2>
                  <p className="font-sans text-base text-muted-foreground leading-normal max-w-md mx-auto">
                    <span className="sm:hidden">
                      {feature.mobileSubtitle || feature.subtitle}
                    </span>
                    <span className="hidden sm:inline">{feature.subtitle}</span>
                  </p>
                </div>
                <div className="w-full border border-border overflow-hidden p-1 sm:p-3 relative">
                  <div className="w-full h-[520px] sm:h-[620px] relative overflow-hidden flex items-center justify-center z-10">
                    <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
                      {index === 0 ? (
                        <TransactionFlowAnimation onComplete={undefined} />
                      ) : index === 1 ? (
                        <InvoicePaymentAnimation onComplete={undefined} />
                      ) : index === 2 ? (
                        <InboxMatchAnimation onComplete={undefined} />
                      ) : index === 3 ? (
                        <DashboardAnimation onComplete={undefined} />
                      ) : index === 4 ? (
                        <AIAssistantAnimation onComplete={undefined} />
                      ) : (
                        <Image
                          src={feature.illustration}
                          alt={feature.title}
                          width={600}
                          height={450}
                          className="w-full h-full object-contain"
                          priority
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Two-column interactive list + canvas */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 lg:h-[740px]">
            <div className="flex gap-6">
              {/* Timeline */}
              <div className="flex flex-col justify-center items-center flex-shrink-0 relative">
                <div className="flex flex-col justify-center space-y-5 lg:space-y-6 mt-2 lg:mt-3">
                  <div
                    className="flex items-center justify-center relative mb-4 lg:mb-6"
                    style={{ minHeight: "3rem" }}
                  ></div>
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-center relative"
                      style={{ minHeight: "3.5rem" }}
                    >
                      <button
                        onClick={() => setActiveFeature(index)}
                        className="cursor-pointer relative z-10"
                        style={{ marginTop: "0.125rem" }}
                        type="button"
                        aria-label={`Go to feature: ${feature.title}`}
                      >
                        <motion.div
                          className={`w-2 h-2 rounded-none transition-all duration-300 ${
                            activeFeature === index
                              ? "bg-primary"
                              : "bg-border hover:bg-muted-foreground"
                          }`}
                          animate={{
                            scale: activeFeature === index ? 1.2 : 1,
                          }}
                          transition={{
                            duration: 0.2,
                            ease: "easeOut",
                          }}
                        />
                      </button>
                      {index < features.length - 1 && (
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
                    How it works
                  </h2>
                </div>
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all duration-300 flex items-start ${
                      activeFeature === index
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-80"
                    }`}
                    onClick={() => setActiveFeature(index)}
                    style={{ minHeight: "3rem" }}
                  >
                    {activeFeature === index ? (
                      <motion.div
                        initial={{ opacity: 0, filter: "blur(6px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(6px)" }}
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden"
                      >
                        <h2 className="font-sans text-lg lg:text-xl text-primary transition-colors duration-300 max-w-md">
                          {feature.title}
                        </h2>
                        <p className="font-sans text-sm text-primary leading-relaxed max-w-md mt-1">
                          {feature.subtitle}
                        </p>
                      </motion.div>
                    ) : (
                      <div>
                        <h2 className="font-sans text-lg lg:text-xl text-muted-foreground transition-colors duration-300 max-w-md">
                          {feature.title}
                        </h2>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center p-6 lg:p-8 border border-border h-full overflow-hidden relative bg-background">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center"
                style={{ transformOrigin: "center" }}
              >
                <div
                  className={`w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95] ${
                    activeFeature === 3 ? "lg:scale-[0.94]" : ""
                  }`}
                >
                  {activeFeature === 0 ? (
                    <TransactionFlowAnimation
                      onComplete={() =>
                        setActiveFeature((prev) => (prev + 1) % features.length)
                      }
                    />
                  ) : activeFeature === 1 ? (
                    <InvoicePaymentAnimation
                      onComplete={() =>
                        setActiveFeature((prev) => (prev + 1) % features.length)
                      }
                    />
                  ) : activeFeature === 2 ? (
                    <InboxMatchAnimation
                      onComplete={() =>
                        setActiveFeature((prev) => (prev + 1) % features.length)
                      }
                    />
                  ) : activeFeature === 3 ? (
                    <DashboardAnimation
                      onComplete={() =>
                        setActiveFeature((prev) => (prev + 1) % features.length)
                      }
                    />
                  ) : activeFeature === 4 ? (
                    <AIAssistantAnimation
                      onComplete={() =>
                        setActiveFeature((prev) => (prev + 1) % features.length)
                      }
                    />
                  ) : (
                    <Image
                      src={features[activeFeature].illustration}
                      alt={features[activeFeature].title}
                      width={600}
                      height={450}
                      className="w-full h-full object-contain"
                      priority
                    />
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

      {/* Assistant Features Overview Section */}
      <FeaturesGridSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Time Savings Bento Grid Section */}
      <TimeSavingsSection />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Weekly Audio Section */}
      <WeeklyAudioSection audioUrl="https://cdn.midday.ai/weekly-speech.mp3" />

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      {/* Pre-accounting Features Section */}
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
