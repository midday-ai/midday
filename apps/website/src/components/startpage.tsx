"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
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
    title: "Automatic reconciliation",
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
                <Link
                  href="/computer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-xs font-sans text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Introducing Midday Computer
                  <span aria-hidden="true">&rarr;</span>
                </Link>

                <h1 className="font-serif text-3xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl 2xl:text-7xl 3xl:text-8xl leading-[1.1] tracking-tight text-foreground">
                  The business stack for{" "}
                  <em className="not-italic text-muted-foreground/80">
                    modern
                  </em>{" "}
                  founders
                </h1>

                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed font-sans max-w-xl mx-auto">
                  Send invoices, automatic reconciliation, track billable hours,
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
                    <a
                      href="/mcp/manus"
                      className="text-muted-foreground opacity-40 hover:opacity-100 hover:text-[#34322D] dark:hover:text-white transition-all duration-200"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 60 60"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M9.40053 8.55807C8.88268 9.62143 9.31868 10.9063 10.3744 11.4279C11.8907 12.1771 13.2065 12.9159 14.5094 14.3954C15.2896 15.2815 16.6353 15.3627 17.515 14.5768C18.3947 13.7909 18.4753 12.4354 17.695 11.5493C15.8385 9.441 13.9275 8.40615 12.2497 7.57715C11.194 7.05554 9.91838 7.49471 9.40053 8.55807Z"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M20.9079 2.31393C19.7672 2.60119 19.0736 3.76554 19.3588 4.91457C19.558 5.71734 19.7438 6.40375 19.9139 7.03212C20.2395 8.2348 20.5075 9.22481 20.7019 10.4109C20.8934 11.5795 21.9892 12.3704 23.1493 12.1775C24.3095 11.9846 25.0947 10.8809 24.9032 9.71228C24.6735 8.31044 24.3157 6.98407 23.9566 5.65277C23.7976 5.06324 23.6383 4.47275 23.4898 3.87432C23.2046 2.72528 22.0487 2.02667 20.9079 2.31393Z"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M33.0786 3.63329C32.0734 3.01888 30.7639 3.34167 30.154 4.35425C29.0225 6.23259 28.4277 8.08208 27.8752 10.308C27.59 11.457 28.2836 12.6213 29.4244 12.9086C30.5651 13.1959 31.7211 12.4973 32.0063 11.3482C32.5183 9.28501 32.9881 7.91768 33.7944 6.5792C34.4044 5.56662 34.0839 4.24769 33.0786 3.63329Z"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M43.9331 56.6106C48.0617 53.9722 50.9164 39.8218 50.2884 35.6081C50.2884 35.6081 49.634 33.3459 48.0372 33.3459C46.8137 33.3458 46.1377 34.3405 45.8884 34.8057C45.6728 34.7259 45.4533 34.6537 45.2792 34.5975L44.9304 34.4861 44.6964 34.4115C44.5053 34.3503 44.3255 34.2913 44.1561 34.2328L44.1566 34.1728C44.164 32.8051 44.025 30.6709 42.6083 28.4471C42.3816 28.0912 42.1677 27.7731 41.9848 27.5032L41.8701 27.3342C41.734 27.1338 41.6272 26.9765 41.5245 26.8195C41.2723 26.4345 41.2034 26.2861 41.1767 26.2177L41.1755 26.2146C41.1651 26.1881 41.1438 26.1341 41.138 25.9694C41.1309 25.7671 41.1481 25.3842 41.2793 24.7145L41.9612 21.9896 41.9637 21.9756C42.0087 21.7255 42.0491 21.5007 42.0711 21.1346C42.0914 20.7976 42.0956 20.3078 42.01 19.7398C41.8478 18.6638 41.2257 16.6243 39.0332 15.442C38.4974 15.153 37.8556 14.9801 37.2229 14.8974C36.7976 14.8417 36.229 14.8037 35.5687 14.8547C34.2216 14.9587 32.4539 15.4438 30.8803 16.8865L30.4884 17.2987C29.5737 18.4035 28.6076 19.7714 27.8747 20.9819C25.6495 19.9345 23.0302 18.732 21.2001 18.0855C19.1915 17.3759 16.9497 16.7821 14.843 16.8585C12.5099 16.9431 9.88675 17.9212 8.51344 20.6897C7.94928 21.8269 7.70856 23.1551 7.99827 24.5393C8.27511 25.8621 8.95981 26.8738 9.61373 27.5797C10.8279 28.8904 12.4542 29.7023 13.6004 30.1944C14.478 30.5712 15.3797 30.8848 16.178 31.1385C16.0937 31.2911 16.0092 31.4491 15.9278 31.6094C15.6864 32.0841 15.3976 32.7191 15.2075 33.4457C15.0179 34.1702 14.8684 35.2025 15.1387 36.367C15.4161 37.5623 15.965 38.4957 16.6189 39.2096C16.5941 39.5809 16.5848 39.9722 16.5986 40.3769C16.6906 43.0808 18.3417 44.8835 19.7939 45.9057C21.1776 46.8796 22.8071 47.4773 24.1246 47.8792C25.3968 48.2673 26.7402 48.5753 27.8317 48.8255L28.0653 48.8791C29.2286 49.1463 30.3783 49.4555 31.5285 49.7647C32.833 50.1155 34.1381 50.4664 35.4641 50.7565C35.8978 50.8514 36.3192 50.9422 36.7069 51.0249L36.8481 51.393C38.5683 55.7887 40.8651 58.5713 43.9331 56.6106ZM28.2156 38.6193C27.9801 38.5236 27.845 38.4602 27.7251 38.3997C26.6832 37.8576 25.4015 38.2663 24.8596 39.3147C24.3165 40.3653 24.723 41.6609 25.7659 42.2079C25.8514 42.2525 25.9381 42.2945 26.0253 42.3356C26.1714 42.4046 26.3749 42.4963 26.6227 42.597C27.1114 42.7955 27.8062 43.0427 28.5938 43.211C29.9917 43.5097 32.5756 43.7375 34.3274 41.715C35.1684 40.7441 35.5727 39.4684 35.7263 38.2756C35.8845 37.0467 35.8056 35.6985 35.4968 34.3864C34.8887 31.8017 33.2785 28.9733 30.272 27.6319C27.6959 26.4825 25.1502 26.2123 23.0033 26.4547C21.57 26.6166 20.2006 27.0229 19.1006 27.6421V27.5944C16.4105 26.8207 11.0571 25.2808 12.3754 22.6232C13.3748 20.6086 16.1129 20.7751 19.8267 22.0871C21.3351 22.62 23.4312 23.5696 25.4084 24.4956C26.0213 24.7827 26.6228 25.0674 27.1918 25.3369C28.0211 25.7295 29.4076 26.3762 29.4076 26.3762C30.9845 24.47 31.5968 23.42 32.1372 22.4931C32.5089 21.8557 32.8466 21.2765 33.4408 20.5172C34.2818 19.4424 35.6412 18.7782 37.0357 19.1671C38.0076 19.6912 37.7607 21.015 37.7607 21.015L37.0852 23.7141C36.4404 26.8905 37.1541 27.9417 38.3305 29.6741C38.5371 29.9784 38.7581 30.3038 38.9884 30.6653C39.9266 32.1381 39.8833 33.5542 39.8479 34.71C39.8251 35.4534 39.8057 36.0891 40.0528 36.5629C40.5618 37.5387 42.4666 38.1438 43.7154 38.5405C44.0155 38.6358 44.2777 38.7191 44.4736 38.7927L44.6074 38.8457C44.4314 39.3955 44.2715 39.9646 44.1117 40.5332C43.4013 43.0618 42.6941 45.5791 40.5854 46.3334C37.9241 47.2853 35.2627 46.3846 35.2627 46.3846C34.783 46.2434 34.2945 46.1341 33.806 46.0247C33.1971 45.8885 32.588 45.7521 31.9952 45.554C31.1691 45.2451 30.0119 44.9796 28.7543 44.691C25.7598 44.004 22.1958 43.1863 21.1752 41.3406C21.0033 41.0297 20.9035 40.6896 20.8908 40.316C20.8331 38.6187 21.4235 37.099 21.4235 37.099C21.4235 37.099 20.5079 37.1028 19.8658 36.4806C19.6264 36.2487 19.4251 35.9298 19.3233 35.4913C19.12 34.6153 19.2946 33.3456 20.3591 32.2733L20.8926 31.7374C21.1621 31.466 21.961 30.8884 23.4778 30.7171C24.9176 30.5545 26.7 30.7292 28.5474 31.5535C29.9644 32.1857 30.9442 33.6362 31.3534 35.3755C31.5534 36.2255 31.5901 37.0507 31.5034 37.724C31.4121 38.4334 31.211 38.7887 31.1188 38.8952C31.0042 39.0275 30.6006 39.2553 29.4775 39.0153C29.0047 38.9142 28.5556 38.7574 28.2156 38.6193Z"
                        />
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
