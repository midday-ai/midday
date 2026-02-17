"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Dynamic imports for animations (5,500+ lines - loaded after hero)
const AIAssistantAnimation = dynamic(() =>
  import("@midday/ui/animations/ai-assistant").then(
    (m) => m.AIAssistantAnimation,
  ),
);
const DashboardAnimation = dynamic(() =>
  import("@midday/ui/animations/dashboard").then((m) => m.DashboardAnimation),
);
const InboxMatchAnimation = dynamic(() =>
  import("@midday/ui/animations/inbox-match").then(
    (m) => m.InboxMatchAnimation,
  ),
);
const InvoicePaymentAnimation = dynamic(() =>
  import("@midday/ui/animations/invoice-payment").then(
    (m) => m.InvoicePaymentAnimation,
  ),
);
const TransactionFlowAnimation = dynamic(() =>
  import("@midday/ui/animations/transaction-flow").then(
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

// Static features data - moved outside component to avoid recreation on each render
const features = [
  {
    title: "All your transactions, unified",
    subtitle:
      "Every payment in and out of the business is automatically synced from your connected accounts.",
    mobileSubtitle: "Every payment in and out is pulled in automatically.",
    illustration: "animation",
  },
  {
    title: "Invoices get paid",
    subtitle:
      "Customers can pay invoices online, with payments flowing straight into your finances.",
    mobileSubtitle:
      "Customers can pay invoices online with payments flowing straight into your finances.",
    illustration: "animation",
  },
  {
    title: "Reconciliation gets handled",
    subtitle:
      "Payments, receipts, and transactions are automatically matched so records stay accurate.",
    mobileSubtitle:
      "Transactions are categorized and reconciled automatically.",
    illustration: "animation",
  },
  {
    title: "Understand what's happening",
    subtitle:
      "Midday explains changes in cash, revenue, and spending as they happen.",
    mobileSubtitle: "See what's changing and why.",
    illustration: "animation",
  },
  {
    title: "Stay updated and in control",
    subtitle:
      "Weekly summaries and notifications keep you on top without constant checking.",
    mobileSubtitle: "Weekly summaries keep you up to date.",
    illustration: "animation",
  },
];

const videos = [
  {
    id: "overview",
    title: "Overview",
    subtitle:
      "See how Midday helps you run your business finances without manual work.",
    url: "https://cdn.midday.ai/videos/login-video.mp4",
  },
  {
    id: "assistant",
    title: "Assistant",
    subtitle:
      "Ask questions and get clear answers based on your business data, including revenue and expenses.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "insights",
    title: "Insights",
    subtitle:
      "Understand how your business evolves with live widgets and summaries highlighting what's changing.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "transactions",
    title: "Transactions",
    subtitle:
      "Every payment is automatically collected, categorized, and kept in one place so nothing gets lost.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "inbox",
    title: "Inbox",
    subtitle:
      "Receipts and invoices are pulled from email and payments, then matched to transactions automatically.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "time-tracking",
    title: "Time tracking",
    subtitle:
      "Track time across projects and customers, then turn hours into accurate invoices so nothing is missed.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "invoicing",
    title: "Invoicing",
    subtitle:
      "Create invoices, send to customers, and track payments flowing into your financial overview.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "customers",
    title: "Customers",
    subtitle:
      "See revenue, profitability, and activity per customer in one place without switching between tools.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
  {
    id: "files",
    title: "Files",
    subtitle:
      "Smart storage that automatically organizes and connects files to transactions, invoices, and customers.",
    url: "https://cdn.midday.ai/videos/login-video.mp4", // Replace with actual video URL
  },
];

export function StartPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [isDashboardLightLoaded, setIsDashboardLightLoaded] = useState(false);
  const [isDashboardDarkLoaded, setIsDashboardDarkLoaded] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState("overview");
  const [videoProgress, setVideoProgress] = useState(0);

  const videoContainerRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const videoTagsScrollRef = useRef<HTMLDivElement>(null);
  const styleSheetRef = useRef<HTMLStyleElement | null>(null);

  // Handle video load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoad = () => setIsVideoLoaded(true);

    if (video.readyState >= 3) {
      setIsVideoLoaded(true);
    }

    video.addEventListener("canplay", handleLoad);
    video.addEventListener("loadeddata", handleLoad);

    return () => {
      video.removeEventListener("canplay", handleLoad);
      video.removeEventListener("loadeddata", handleLoad);
    };
  }, []);

  // Handle modal video switching
  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video || !isVideoModalOpen) return;

    const activeVideo = videos.find((v) => v.id === activeVideoId);
    if (activeVideo) {
      if (video.src !== activeVideo.url) {
        video.src = activeVideo.url;
        video.load();
        setVideoProgress(0);
      }
      // Try to play when video is ready
      const handleCanPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay may fail, user can click play
          });
        }
      };
      video.addEventListener("canplay", handleCanPlay);
      // If already loaded, play immediately
      if (video.readyState >= 3) {
        handleCanPlay();
      }
      return () => {
        video.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [activeVideoId, isVideoModalOpen]);

  // Track video progress
  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video || !isVideoModalOpen) return;

    const updateProgress = () => {
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        setVideoProgress(progress);
      }
    };

    const handleTimeUpdate = () => updateProgress();
    const handleLoadedMetadata = () => {
      setVideoProgress(0);
      updateProgress();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [activeVideoId, isVideoModalOpen]);

  // Inject video modal styles
  useEffect(() => {
    if (!isVideoModalOpen) return;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      video::-webkit-media-controls-timeline,
      video::-webkit-media-controls-current-time-display,
      video::-webkit-media-controls-time-remaining-display,
      video::-webkit-media-controls-timeline-container,
      video::-webkit-media-controls-panel {
        display: none !important;
      }
      video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
    `;
    document.head.appendChild(style);
    styleSheetRef.current = style;

    return () => {
      if (styleSheetRef.current) {
        document.head.removeChild(styleSheetRef.current);
        styleSheetRef.current = null;
      }
    };
  }, [isVideoModalOpen]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative min-h-screen overflow-visible lg:overflow-hidden">
        <div className="flex flex-col min-h-screen relative pt-32 pb-12 sm:py-32 md:pt-24 lg:pt-0 overflow-hidden">
          {/* Header content - centered on mobile, side-by-side on desktop */}
          <div className="flex-1 lg:flex-none flex flex-col justify-center md:justify-start md:pt-16 lg:pt-56 items-center lg:items-stretch space-y-8 lg:space-y-0 z-20 px-3 sm:px-4 lg:px-0 lg:max-w-[1400px] lg:mx-auto lg:w-full lg:mb-12 xl:mb-12 2xl:mb-12 3xl:mb-16">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end w-full space-y-8 lg:space-y-0">
              <div className="space-y-4 lg:space-y-3 text-center lg:text-left max-w-xl mx-auto lg:mx-0 px-2 lg:px-0">
                <h1 className="font-serif text-3xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3]">
                  <span className="text-foreground">
                    Run your business finances without manual work.
                  </span>
                </h1>

                <p className="text-muted-foreground text-base leading-normal font-sans max-w-md lg:max-w-none text-center mx-auto lg:text-left lg:mx-0">
                  One place for transactions, receipts, invoices and everything
                  around it.
                </p>
              </div>

              <div className="space-y-4 text-center lg:text-right w-full lg:w-auto lg:flex lg:flex-col lg:items-end">
                <div className="flex flex-col gap-3 w-full max-w-md mx-auto lg:mx-0 lg:w-auto">
                  <Button
                    asChild
                    className="w-full lg:w-auto btn-inverse h-11 px-5 lg:px-4 transition-colors"
                  >
                    <a href="https://app.midday.ai/">
                      <span className="text-inherit text-sm">
                        Set up your business
                      </span>
                    </a>
                  </Button>
                </div>

                <p className="text-muted-foreground text-xs font-sans">
                  <span className="lg:hidden">
                    14-day free trial · Cancel anytime
                  </span>
                  <span className="hidden lg:inline">
                    14-day free trial. Cancel anytime.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Video section */}
          <div
            className="mt-8 mb-8 md:mt-12 lg:mt-0 lg:mb-4 3xl:mb-20 overflow-visible lg:w-full"
            ref={videoContainerRef}
          >
            <div className="relative overflow-hidden">
              {/* Poster image with fade and blur effect */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out z-[1] ${
                  isVideoLoaded
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
                style={{
                  filter: isVideoLoaded ? "blur(0px)" : "blur(1px)",
                }}
              >
                <Image
                  src="https://cdn.midday.ai/video-poster-v2.jpg"
                  alt="Midday dashboard preview"
                  fill
                  fetchPriority="high"
                  quality={50}
                  sizes="100vw"
                  className="object-cover transition-all duration-1000 ease-in-out"
                  style={{
                    filter: isPosterLoaded ? "blur(0px)" : "blur(12px)",
                    transform: isPosterLoaded ? "scale(1)" : "scale(1.05)",
                  }}
                  priority
                  onLoad={() => setIsPosterLoaded(true)}
                />
              </div>

              <video
                ref={videoRef}
                className={`w-full h-[420px] sm:h-[520px] md:h-[600px] lg:h-[800px] xl:h-[900px] 3xl:h-[1000px] object-cover transition-opacity duration-1000 ease-in-out ${
                  isVideoLoaded ? "opacity-100" : "opacity-0"
                }`}
                autoPlay
                loop
                muted
                playsInline
                preload="none"
              >
                <source
                  src="https://cdn.midday.ai/videos/login-video.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Dashboard overlay - different styles for mobile vs desktop */}
              <div className="absolute inset-0 flex items-center justify-center p-0 lg:p-4 z-[2]">
                <div className="relative lg:static scale-[0.95] md:scale-100 lg:scale-100 lg:h-full lg:flex lg:flex-col lg:items-center lg:justify-center">
                  <Image
                    src="/images/dashboard-light.svg"
                    alt="Dashboard illustration"
                    width={1600}
                    height={1200}
                    className="w-full h-auto md:!scale-[0.85] lg:!scale-100 lg:object-contain lg:max-w-[85%] 2xl:max-w-[75%] dark:hidden lg:[transform:rotate(-2deg)_skewY(1deg)] lg:[filter:drop-shadow(0_30px_60px_rgba(0,0,0,0.6))] transition-all duration-700 ease-out"
                    style={{
                      filter: isDashboardLightLoaded
                        ? "blur(0px) drop-shadow(0 30px 60px rgba(0,0,0,0.6))"
                        : "blur(20px)",
                      transform: isDashboardLightLoaded
                        ? "scale(1)"
                        : "scale(1.02)",
                    }}
                    priority
                    fetchPriority="high"
                    onLoad={() => setIsDashboardLightLoaded(true)}
                  />
                  <Image
                    src="/images/dashboard-dark.svg"
                    alt="Dashboard illustration"
                    width={1600}
                    height={1200}
                    className="w-full h-auto md:!scale-[0.85] lg:!scale-100 lg:object-contain lg:max-w-[85%] 2xl:max-w-[75%] hidden dark:block lg:[transform:rotate(-2deg)_skewY(1deg)] lg:[filter:drop-shadow(0_30px_60px_rgba(0,0,0,0.6))] transition-all duration-700 ease-out"
                    style={{
                      filter: isDashboardDarkLoaded
                        ? "blur(0px) drop-shadow(0 30px 60px rgba(0,0,0,0.6))"
                        : "blur(20px)",
                      transform: isDashboardDarkLoaded
                        ? "scale(1)"
                        : "scale(1.02)",
                    }}
                    priority
                    fetchPriority="high"
                    onLoad={() => setIsDashboardDarkLoaded(true)}
                  />
                </div>
              </div>

              {/* Play Button Overlay */}
              <button
                type="button"
                onClick={() => {
                  setIsVideoModalOpen(true);
                  setActiveVideoId("overview");
                }}
                className={`hidden absolute inset-0 z-[4] flex items-center justify-center pointer-events-none transition-opacity duration-500 delay-300 ${
                  isDashboardLightLoaded || isDashboardDarkLoaded
                    ? "opacity-100"
                    : "opacity-0"
                }`}
                aria-label="Play video"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-muted hover:bg-secondary hover:scale-105 flex items-center justify-center transition-all duration-200 pointer-events-auto">
                  <Icons.Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div
            className="fixed inset-0 bg-white/40 backdrop-blur-sm dark:bg-black/40 transition-opacity duration-200"
            onClick={() => setIsVideoModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              animation: "fadeIn 200ms ease-out",
            }}
          />
          <div
            className="relative bg-background border border-border max-w-4xl max-h-[90vh] overflow-hidden z-[10000] flex flex-col"
            style={{
              animation: "fadeIn 200ms ease-out 50ms both",
            }}
          >
            {/* Video Player - Center */}
            <div className="relative w-full aspect-video bg-background">
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="hidden sm:block absolute top-4 right-4 z-10 backdrop-blur-md bg-background-semi-transparent p-2 transition-colors"
                aria-label="Close dialog"
              >
                <Icons.Close className="h-5 w-5 text-foreground" />
              </button>
              <video
                ref={modalVideoRef}
                className="w-full h-full"
                autoPlay
                playsInline
                loop
                muted
                controls
                controlsList="nodownload noplaybackrate"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source
                  src={videos.find((v) => v.id === activeVideoId)?.url || ""}
                  type="video/mp4"
                />
              </video>
            </div>

            {/* Video List - Below Video */}
            <div className="relative w-full border-t border-border bg-background overflow-hidden">
              <div
                ref={videoTagsScrollRef}
                className="overflow-x-auto scrollbar-hide"
              >
                <div className="p-4 lg:p-6">
                  <div className="flex gap-4">
                    {videos.map((video, index) => (
                      <div key={video.id} className="flex items-stretch">
                        {index > 0 && <div className="w-px bg-border mr-4" />}
                        <button
                          type="button"
                          onClick={(e) => {
                            setActiveVideoId(video.id);
                            setVideoProgress(0);

                            const scrollContainer = videoTagsScrollRef.current;
                            if (!scrollContainer) return;

                            const buttonRect =
                              e.currentTarget.getBoundingClientRect();
                            const containerRect =
                              scrollContainer.getBoundingClientRect();
                            const currentScrollLeft =
                              scrollContainer.scrollLeft;

                            // Check if this is the last visible tag and scroll to show next one
                            if (index < videos.length - 1) {
                              const isLastVisible =
                                buttonRect.right >= containerRect.right - 50; // 50px threshold

                              if (isLastVisible) {
                                const nextTag = scrollContainer.querySelector(
                                  `[data-video-index="${index + 1}"]`,
                                ) as HTMLElement;
                                if (nextTag) {
                                  const nextTagRect =
                                    nextTag.getBoundingClientRect();
                                  // Calculate how much to scroll to show the next tag
                                  const scrollAmount =
                                    nextTagRect.right -
                                    containerRect.right +
                                    20; // 20px padding

                                  scrollContainer.scrollTo({
                                    left: currentScrollLeft + scrollAmount,
                                    behavior: "smooth",
                                  });
                                }
                              }
                            }

                            // Check if this is the first visible tag and scroll to show previous one
                            if (index > 0) {
                              const isFirstVisible =
                                buttonRect.left <= containerRect.left + 50; // 50px threshold

                              if (isFirstVisible) {
                                const prevTag = scrollContainer.querySelector(
                                  `[data-video-index="${index - 1}"]`,
                                ) as HTMLElement;
                                if (prevTag) {
                                  const prevTagRect =
                                    prevTag.getBoundingClientRect();
                                  // Calculate how much to scroll to show the previous tag
                                  const scrollAmount =
                                    containerRect.left - prevTagRect.left + 20; // 20px padding

                                  scrollContainer.scrollTo({
                                    left: currentScrollLeft - scrollAmount,
                                    behavior: "smooth",
                                  });
                                }
                              }
                            }
                          }}
                          data-video-index={index}
                          className={`w-[100px] sm:w-[140px] md:w-[310px] flex-shrink-0 pt-1 pb-3 md:pt-2 md:pb-5 transition-colors flex flex-col items-start gap-1 md:gap-2 text-left relative bg-background text-muted-foreground hover:text-foreground ${index > 0 ? "pl-2" : ""}`}
                        >
                          <span
                            className={`font-sans text-sm md:text-base leading-tight text-left ${activeVideoId === video.id ? "text-primary" : ""}`}
                          >
                            {video.title}
                          </span>
                          {video.subtitle && (
                            <span className="hidden md:block font-sans text-xs text-muted-foreground leading-tight text-left">
                              {video.subtitle}
                            </span>
                          )}
                          {activeVideoId === video.id && (
                            <div
                              className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-150"
                              style={{ width: `${videoProgress}%` }}
                            />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Gradient fade-out on the right */}
              <div
                className="absolute top-0 right-0 bottom-0 w-24 pointer-events-none z-10"
                style={{
                  background:
                    "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 30%, hsla(var(--background), 0.8) 50%, hsla(var(--background), 0.4) 70%, transparent 100%)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Features 2-Column Layout Section */}
      <section className="bg-background pt-12 sm:pt-2 lg:pt-6 xl:pt-8 2xl:pt-12 3xl:pt-32 pb-20 lg:pb-24">
        <div className="max-w-[1400px] mx-auto">
          {/* Mobile: Stacked features */}
          <div className="grid grid-cols-1 gap-12 sm:gap-16 lg:hidden">
            <div className="hidden lg:block text-center mb-2">
              <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
                How it works
              </h2>
            </div>
            {features.map((feature, index) => (
              <div key={index.toString()} className="space-y-6 sm:space-y-8">
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
                          loading="lazy"
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
                  />
                  {features.map((feature, index) => (
                    <div
                      key={feature.title}
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
                        <div
                          className={`w-2 h-2 rounded-none transition-all duration-200 ease-out ${
                            activeFeature === index
                              ? "bg-primary scale-[1.2]"
                              : "bg-border hover:bg-muted-foreground scale-100"
                          }`}
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
                    key={index.toString()}
                    className={`cursor-pointer transition-all duration-300 flex items-start ${
                      activeFeature === index
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-80"
                    }`}
                    onClick={() => setActiveFeature(index)}
                    style={{ minHeight: "3rem" }}
                  >
                    {activeFeature === index ? (
                      <div className="overflow-hidden animate-[fadeInBlur_0.35s_ease-out_forwards]">
                        <h2 className="font-sans text-lg lg:text-xl text-primary transition-colors duration-300 max-w-md">
                          {feature.title}
                        </h2>
                        <p className="font-sans text-sm text-primary leading-relaxed max-w-md mt-1">
                          {feature.subtitle}
                        </p>
                      </div>
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
              <div
                key={activeFeature}
                className="w-[400px] h-[500px] sm:w-[520px] sm:h-[640px] lg:w-[600px] lg:h-[700px] relative overflow-hidden z-10 flex items-center justify-center animate-[fadeInScale_0.4s_ease-out_forwards]"
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
                      src={features[activeFeature]?.illustration ?? ""}
                      alt={features[activeFeature]?.title ?? "Feature"}
                      width={600}
                      height={450}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  )}
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
