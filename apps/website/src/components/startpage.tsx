"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Dynamic imports for animations (5,500+ lines - loaded after hero)
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
      "Customers can pay invoices online, with payments tracked automatically.",
    mobileSubtitle:
      "Customers can pay invoices online with payments tracked automatically.",
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
];

const videos = [
  {
    id: "overview",
    title: "Overview",
    subtitle: "See how Midday helps you run your business without the admin.",
    url: "https://cdn.midday.ai/videos/login-video.mp4",
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
      "Create invoices, send to customers, and track payments in one place.",
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
          <div className="flex-1 lg:flex-none flex flex-col justify-center md:justify-start md:pt-16 lg:pt-48 items-center space-y-8 lg:space-y-0 z-20 px-3 sm:px-4 lg:px-0 lg:max-w-[1400px] lg:mx-auto lg:w-full lg:mb-12 xl:mb-12 2xl:mb-12 3xl:mb-16">
            <div className="flex flex-col items-center w-full text-center space-y-6 lg:space-y-8">
              <div className="space-y-5 lg:space-y-6 max-w-3xl 3xl:max-w-5xl mx-auto px-2 lg:px-0">
                <h1 className="font-serif text-3xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl 2xl:text-7xl 3xl:text-8xl leading-[1.1] tracking-tight text-foreground">
                  The business stack for{" "}
                  <em className="not-italic text-muted-foreground/80">
                    modern
                  </em>{" "}
                  founders
                </h1>

                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed font-sans max-w-xl mx-auto">
                  Send invoices, reconcile transactions, track billable hours,
                  get financial insights, and export clean books to your
                  accountant.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 pt-2">
                <Button
                  asChild
                  className="btn-inverse h-11 px-6 transition-colors"
                >
                  <a
                    href="https://app.midday.ai/"
                    onClick={() =>
                      track({
                        event: LogEvents.CTA.name,
                        channel: LogEvents.CTA.channel,
                        label: "Start your trial",
                        position: "hero",
                      })
                    }
                  >
                    <span className="text-inherit text-sm">
                      Start your trial
                    </span>
                  </a>
                </Button>

                <p className="text-muted-foreground text-xs font-sans">
                  14-day free trial · Cancel anytime
                </p>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <div className="flex items-center gap-2.5">
                    <a
                      href="/mcp/claude"
                      className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-[#D97757] transition-all duration-200"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
                      </svg>
                    </a>
                    <a
                      href="/mcp/chatgpt"
                      className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground transition-all duration-200"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855L13.104 8.364l2.02-1.164a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.41-.676zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.306 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.074a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.361L12 9.006l2.603 1.506v3.012L12 15.03l-2.603-1.506z" />
                      </svg>
                    </a>
                    <a
                      href="/mcp/perplexity"
                      className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-[#20808D] transition-all duration-200"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
                      </svg>
                    </a>
                    <a
                      href="/mcp/raycast"
                      className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-[#FF6363] transition-all duration-200"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6.004 15.492v2.504L0 11.992l1.258-1.249Zm2.504 2.504H6.004L12.008 24l1.253-1.253zm14.24-4.747L24 11.997 12.003 0 10.75 1.251 15.491 6h-2.865L9.317 2.692 8.065 3.944l2.06 2.06H8.691v9.31H18v-1.432l2.06 2.06 1.252-1.252-3.312-3.32V8.506ZM6.63 5.372 5.38 6.625l1.342 1.343 1.251-1.253Zm10.655 10.655-1.247 1.251 1.342 1.343 1.253-1.251zM3.944 8.059 2.692 9.31l3.312 3.314v-2.506zm9.936 9.937h-2.504l3.314 3.312 1.25-1.252z" />
                      </svg>
                    </a>
                    <a
                      href="/mcp/cursor"
                      className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-foreground transition-all duration-200"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
                      </svg>
                    </a>
                  </div>
                </div>
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
                <div className="w-full h-full origin-center scale-[0.85] sm:scale-[0.90] lg:scale-[0.95]">
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

      {/* Features Overview Section */}
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
