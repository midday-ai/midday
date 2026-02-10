"use client";

import { Icons } from "@midday/ui/icons";
import type Hls from "hls.js";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "../homepage/icon-mapping";
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "../motion-primitives/morphing-dialog";

export interface Testimonial {
  name: string;
  title: string;
  company: string;
  country: string;
  content: string;
  fullContent: string;
  image?: string;
  video?: string;
  videoPoster?: string;
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
  title?: string;
  subtitle?: string;
  showStars?: boolean;
  customHeader?: ReactNode;
}

function renderStructuredContent(content: string) {
  const sections = content.split("\n\n");
  const structured: { label: string; text: string }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]?.trim();
    if (!section) continue;

    // Check if this section starts with a label (like "Company", "Challenge", etc.)
    // Labels are typically single words or short phrases followed by a newline
    const lines = section.split("\n");
    const firstLine = lines[0]?.trim();

    if (!firstLine) continue;

    // Check if first line looks like a label (capitalized, no punctuation, short)
    if (
      firstLine.length < 30 &&
      /^[A-Z][a-z\s]+$/.test(firstLine) &&
      lines.length > 1
    ) {
      structured.push({
        label: firstLine,
        text: lines.slice(1).join("\n").trim(),
      });
    } else {
      // If no label, treat as continuation of previous section
      if (structured.length > 0) {
        const lastSection = structured[structured.length - 1];
        if (lastSection) {
          lastSection.text = `${lastSection.text}\n\n${section}`;
        }
      } else {
        structured.push({ label: "", text: section });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {structured.map((section) => (
        <div
          key={section.label || section.text.slice(0, 20)}
          className="flex flex-col gap-2"
        >
          {section.label && (
            <p className="font-sans text-sm text-foreground">{section.label}</p>
          )}
          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
            {section.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function HLSVideo({
  src,
  poster,
}: {
  src: string | undefined;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Check for native HLS support first (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    // Dynamically import hls.js only when needed
    let mounted = true;
    import("hls.js").then(({ default: HlsModule }) => {
      if (!mounted || !video) return;

      if (HlsModule.isSupported()) {
        const hls = new HlsModule();
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
      }
    });

    return () => {
      mounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="w-full h-auto"
      controls
      playsInline
      preload="metadata"
      poster={poster}
      style={{ filter: "grayscale(100%)" }}
    >
      <track kind="captions" />
      Your browser does not support the video tag.
    </video>
  );
}

function VideoTestimonialCard({
  testimonial,
  index,
  rotation,
}: {
  testimonial: Testimonial;
  index: number;
  rotation: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex-shrink-0 group cursor-pointer"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className="bg-background border border-border p-6 w-64 flex flex-col gap-4 transition-all duration-200 hover:border-muted-foreground relative">
          <div className="absolute top-4 right-4 w-7 h-7 bg-muted flex items-center justify-center">
            <MaterialIcon
              name="play_arrow"
              className="text-muted-foreground"
              size={16}
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
              {testimonial.country}
            </p>
            <div className="flex gap-2 items-center">
              {testimonial.image ? (
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full object-cover"
                  style={{ filter: "grayscale(100%)" }}
                />
              ) : (
                <div className="w-4 h-4 bg-muted rounded-full" />
              )}
              <span className="font-sans text-sm text-foreground">
                {testimonial.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-left">
            <span className="font-sans text-sm text-muted-foreground">
              {testimonial.company}
            </span>
            <div className="font-sans text-sm text-muted-foreground leading-relaxed">
              &quot;{testimonial.content}&quot;
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-white/40 backdrop-blur-sm dark:bg-black/40 transition-all duration-300 animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-background border border-border p-8 max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto z-50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6"
              aria-label="Close dialog"
            >
              <Icons.Close className="h-6 w-6 text-primary" />
            </button>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
                  {testimonial.country}
                </p>
                <div className="flex gap-3 items-center">
                  {testimonial.image ? (
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                      style={{ filter: "grayscale(100%)" }}
                    />
                  ) : (
                    <div className="w-6 h-6 bg-muted rounded-full" />
                  )}
                  <span className="font-sans text-sm text-foreground">
                    {testimonial.name}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="w-full overflow-hidden bg-muted">
                  <HLSVideo
                    src={testimonial.video}
                    poster={testimonial.videoPoster}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VideoTestimonialCardMobile({
  testimonial,
  index,
  rotation,
}: {
  testimonial: Testimonial;
  index: number;
  rotation: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = isOpen ? (
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
        className="fixed inset-0 bg-white/40 backdrop-blur-sm dark:bg-black/40 transition-all duration-300 animate-in fade-in"
        onClick={() => setIsOpen(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <div className="relative bg-background border border-border p-8 max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto z-[10000]">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6"
          aria-label="Close dialog"
        >
          <Icons.Close className="h-6 w-6 text-primary" />
        </button>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
              {testimonial.country}
            </p>
            <div className="flex gap-3 items-center">
              {testimonial.image ? (
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                  style={{ filter: "grayscale(100%)" }}
                />
              ) : (
                <div className="w-6 h-6 bg-muted rounded-full" />
              )}
              <span className="font-sans text-sm text-foreground">
                {testimonial.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-full overflow-hidden bg-muted">
              <HLSVideo
                src={testimonial.video}
                poster={testimonial.videoPoster}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      key={`testimonial-mobile-${testimonial.name}-${index}`}
      className="w-[280px] flex-shrink-0 snap-start"
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full cursor-pointer"
        style={{
          transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        }}
      >
        <div className="bg-background border border-border p-8 sm:p-6 flex flex-col gap-4 select-none hover:border-muted-foreground transition-all duration-200 min-h-[240px] sm:min-h-0 relative">
          <div className="absolute top-4 right-4 w-7 h-7 bg-muted flex items-center justify-center">
            <MaterialIcon
              name="play_arrow"
              className="text-muted-foreground"
              size={16}
            />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
              {testimonial.country}
            </p>
            <div className="flex gap-2 items-center">
              {testimonial.image ? (
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full object-cover"
                  style={{ filter: "grayscale(100%)" }}
                />
              ) : (
                <div className="w-4 h-4 bg-muted rounded-full" />
              )}
              <span className="font-sans text-sm text-foreground">
                {testimonial.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-left">
            <span className="font-sans text-sm text-muted-foreground">
              {testimonial.company}
            </span>
            <div className="font-sans text-sm text-muted-foreground leading-relaxed">
              &quot;{testimonial.content}&quot;
            </div>
          </div>
        </div>
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(modalContent, document.body)}
    </div>
  );
}

export const defaultTestimonials: Testimonial[] = [
  {
    name: "Paweł Michalski",
    title: "",
    company: "VC Leaders",
    country: "Poland",
    image: "/stories/pawel.jpeg",
    content:
      "Invoice reconciliation used to take a full day each month and was always stressful. With Midday, that work is mostly gone and we finally have a clear financial overview.",
    fullContent:
      "Company\nVC Leaders is an educational platform helping venture capitalists build better VC firms.\n\nChallenge\nMonthly invoice reconciliation was slow and painful. Missing invoices, manual checks, and no time left to properly categorize or analyze spending. The process regularly took more than a full day.\n\nImpact\nMidday reduced invoice reconciliation time by 1–2 man-days per month and made financial visibility much clearer through dashboards.\n\nFavorite features\nClear financial overview, accounts payable tracking, invoice reconciliation, and a clean, intuitive interface.",
  },
  {
    name: "Facu Montanaro",
    title: "",
    company: "Kundo Studio",
    country: "Argentina",
    image: "/stories/facu.jpeg",
    content:
      "Managing invoicing, projects, and finances across tools slowed my daily work. Midday brought everything into one place and made my workflow much simpler.",
    fullContent:
      "Company\nKundo Studio helps startups and founders with fundraising, product launches, and growth through design and meaningful experiences.\n\nChallenge\nManaging invoicing, projects, and finances across multiple tools made daily work slower and more complex. Existing tools felt fragmented and hard to use.\n\nImpact\nMidday centralized invoicing, time tracking, and project information into one place, significantly simplifying day-to-day operations.\n\nFavorite features\nInvoicing and time tracking. Both became core parts of Facu's daily workflow and replaced multiple separate tools.",
  },
  {
    name: "Richard Poelderl",
    title: "",
    company: "Conduct",
    country: "Germany",
    image: "/stories/richard.jpeg",
    content:
      "My previous accounting setup was fragmented and didn't support my bank. Midday made invoicing easier and sharing clean data with my tax advisor straightforward.",
    fullContent:
      "Company\nRichard works with companies that want to focus product development on building great products while outsourcing growth and marketing execution.\n\nChallenge\nHis accounting tool didn't support his bank, required manual formatting of exports, and forced him to juggle multiple financial tools.\n\nImpact\nMidday replaced bank invoicing and made it easier to work with his tax advisor by exporting clean CSV files that integrate with accounting software. This significantly reduced friction while keeping control in one system.\n\nFavorite features\nInvoicing, CSV exports for tax advisors, and bank sync to track subscriptions and expenses.",
  },
  {
    name: "Guy Solan",
    title: "",
    company: "Thetis Medical",
    country: "United Kingdom",
    image: "/stories/guy.jpeg",
    content:
      "Without Midday, I had no real visibility into our cash and relied entirely on my accountant. It gave me clarity without having to learn complex accounting tools.",
    fullContent:
      "Company\nThetis Medical is a medical device company.\n\nChallenge\nWithout Midday, I had no real visibility into our cash and relied entirely on my accountant.\n\nImpact\nMidday gave me clarity without having to learn complex accounting tools.\n\nFavorite features\nFinancial visibility and cash flow tracking.",
    video:
      "https://customer-oh6t55xltlgrfayh.cloudflarestream.com/5b86803383964d52ee6834fd289f4f4e/manifest/video.m3u8",
    videoPoster: "https://cdn.midday.ai/guy-cover.png",
  },
];

export function TestimonialsSection({
  testimonials = defaultTestimonials,
  title = "Built alongside our users",
  subtitle = "For founders and small teams who run their business every week, every feature earns its place in the workflow.",
  showStars = true,
  customHeader,
}: TestimonialsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastDragDistance = useRef(0);
  const pointerDownRef = useRef<{ time: number; x: number } | null>(null);
  const [shouldBlockClick, setShouldBlockClick] = useState(false);

  // Scroll to center card on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const centerIndex = Math.floor(testimonials.length / 2);
      const cardWidth =
        scrollContainerRef.current.scrollWidth / testimonials.length;
      scrollContainerRef.current.scrollLeft = centerIndex * cardWidth;
    }
  }, [testimonials.length]);

  return (
    <section className="bg-background">
      <div className="max-w-[1400px] mx-auto py-12 sm:py-16 lg:py-24">
        {customHeader ? (
          customHeader
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-3xl">
              <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
                {title}
              </h2>
              <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal">
                {subtitle}
              </p>
            </div>

            {showStars && (
              <div className="flex items-center justify-center mb-6 sm:mb-10">
                <div className="flex gap-1">
                  <MaterialIcon
                    name="star"
                    className="text-muted-foreground"
                    size={16}
                  />
                  <MaterialIcon
                    name="star"
                    className="text-muted-foreground"
                    size={16}
                  />
                  <MaterialIcon
                    name="star"
                    className="text-muted-foreground"
                    size={16}
                  />
                  <MaterialIcon
                    name="star"
                    className="text-muted-foreground"
                    size={16}
                  />
                  <MaterialIcon
                    name="star_half"
                    className="text-muted-foreground"
                    size={16}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Testimonials Grid */}
        <div className="hidden lg:flex gap-3 w-full max-w-5xl mx-auto justify-center">
          {testimonials.map((testimonial, index) => {
            const getRotation = () => {
              if (index === 0) return -1;
              if (index === 1) return 1;
              if (index === 2) return 2;
              if (index === 3) return -2;
              return 0;
            };

            // Simple modal for video testimonials (no morphing)
            if (testimonial.video) {
              return (
                <VideoTestimonialCard
                  key={`testimonial-${testimonial.name}-${index}`}
                  testimonial={testimonial}
                  index={index}
                  rotation={getRotation()}
                />
              );
            }

            // Morphing dialog for regular testimonials
            return (
              <MorphingDialog key={`testimonial-${testimonial.name}-${index}`}>
                <MorphingDialogTrigger
                  className="flex-shrink-0 group"
                  style={{
                    transform: `rotate(${getRotation()}deg)`,
                  }}
                >
                  <div className="bg-background border border-border p-6 w-64 flex flex-col gap-4 transition-all duration-200 hover:border-muted-foreground">
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
                        {testimonial.country}
                      </p>
                      <div className="flex gap-2 items-center">
                        {testimonial.image ? (
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={16}
                            height={16}
                            className="w-4 h-4 rounded-full object-cover"
                            style={{ filter: "grayscale(100%)" }}
                          />
                        ) : (
                          <div className="w-4 h-4 bg-muted rounded-full" />
                        )}
                        <MorphingDialogTitle className="font-sans text-sm text-foreground">
                          {testimonial.name}
                        </MorphingDialogTitle>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-left">
                      <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                        {testimonial.company}
                      </MorphingDialogSubtitle>
                      <div className="font-sans text-sm text-muted-foreground leading-relaxed">
                        &quot;{testimonial.content}&quot;
                      </div>
                    </div>
                  </div>
                </MorphingDialogTrigger>

                <MorphingDialogContainer>
                  <MorphingDialogContent className="bg-background border border-border p-8 max-w-2xl">
                    <MorphingDialogClose />

                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
                          {testimonial.country}
                        </p>
                        <div className="flex gap-3 items-center">
                          {testimonial.image ? (
                            <Image
                              src={testimonial.image}
                              alt={testimonial.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                              style={{ filter: "grayscale(100%)" }}
                            />
                          ) : (
                            <div className="w-6 h-6 bg-muted rounded-full" />
                          )}
                          <MorphingDialogTitle className="font-sans text-sm text-foreground">
                            {testimonial.name}
                          </MorphingDialogTitle>
                        </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                          {testimonial.company}
                        </MorphingDialogSubtitle>
                        <MorphingDialogDescription
                          disableLayoutAnimation
                          variants={{
                            initial: { opacity: 0, scale: 0.8, y: 100 },
                            animate: { opacity: 1, scale: 1, y: 0 },
                            exit: { opacity: 0, scale: 0.8, y: 100 },
                          }}
                          className="font-sans text-sm text-muted-foreground"
                        >
                          {renderStructuredContent(testimonial.fullContent)}
                        </MorphingDialogDescription>
                      </div>
                    </div>
                  </MorphingDialogContent>
                </MorphingDialogContainer>
              </MorphingDialog>
            );
          })}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden w-screen -mx-4 sm:-mx-6 md:-mx-8 pl-4">
          <div
            ref={scrollContainerRef}
            className="relative overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorX: "contain",
            }}
            onScroll={(e) => {
              // Block clicks if scrolling
              const scrollDistance = Math.abs(
                e.currentTarget.scrollLeft - (lastDragDistance.current || 0),
              );
              if (scrollDistance > 15) {
                setShouldBlockClick(true);
                setTimeout(() => {
                  setShouldBlockClick(false);
                }, 300);
              }
              lastDragDistance.current = e.currentTarget.scrollLeft;
            }}
          >
            <div
              className="flex gap-4 pl-4 pr-4"
              style={{ width: "max-content" }}
            >
              {testimonials.map((testimonial, index) => {
                // Calculate rotation based on position relative to center
                const centerIndex = Math.floor(testimonials.length / 2);
                const offset = index - centerIndex;
                let rotation = 0;
                if (index === 0)
                  rotation = 0; // No rotation for first card
                else if (offset === -1) rotation = -1;
                else if (offset === 1) rotation = 1;
                else if (offset === -2) rotation = -2;
                else if (offset === 2) rotation = 2;

                // Simple modal for video testimonials (no morphing)
                if (testimonial.video) {
                  return (
                    <VideoTestimonialCardMobile
                      key={`testimonial-mobile-${testimonial.name}-${index}`}
                      testimonial={testimonial}
                      index={index}
                      rotation={rotation}
                    />
                  );
                }

                return (
                  <div
                    key={`testimonial-mobile-${testimonial.name}-${index}`}
                    className="w-[280px] flex-shrink-0 snap-start"
                  >
                    <MorphingDialog>
                      <div
                        onClick={(e) => {
                          // Block click if there was a drag or if we're blocking clicks
                          if (
                            shouldBlockClick ||
                            lastDragDistance.current > 15
                          ) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        onPointerDown={(e) => {
                          pointerDownRef.current = {
                            time: Date.now(),
                            x: e.clientX,
                          };
                        }}
                        onPointerUp={(e) => {
                          if (pointerDownRef.current) {
                            const timeDiff =
                              Date.now() - pointerDownRef.current.time;
                            const distance = Math.abs(
                              e.clientX - pointerDownRef.current.x,
                            );

                            // Block if it was a long press or significant movement
                            if (timeDiff > 200 || distance > 15) {
                              setShouldBlockClick(true);
                              setTimeout(() => {
                                setShouldBlockClick(false);
                              }, 300);
                            }
                            pointerDownRef.current = null;
                          }
                        }}
                      >
                        <MorphingDialogTrigger
                          className="w-full"
                          style={{
                            pointerEvents: shouldBlockClick ? "none" : "auto",
                            transform:
                              rotation !== 0
                                ? `rotate(${rotation}deg)`
                                : undefined,
                          }}
                        >
                          <div className="bg-background border border-border p-8 sm:p-6 flex flex-col gap-4 select-none hover:border-muted-foreground transition-all duration-200 min-h-[240px] sm:min-h-0">
                            <div className="flex flex-col gap-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
                                {testimonial.country}
                              </p>
                              <div className="flex gap-2 items-center">
                                {testimonial.image ? (
                                  <Image
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 rounded-full object-cover"
                                    style={{ filter: "grayscale(100%)" }}
                                  />
                                ) : (
                                  <div className="w-4 h-4 bg-muted rounded-full" />
                                )}
                                <MorphingDialogTitle className="font-sans text-sm text-foreground">
                                  {testimonial.name}
                                </MorphingDialogTitle>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 text-left">
                              <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                                {testimonial.company}
                              </MorphingDialogSubtitle>
                              <div className="font-sans text-sm text-muted-foreground leading-relaxed">
                                &quot;{testimonial.content}&quot;
                              </div>
                            </div>
                          </div>
                        </MorphingDialogTrigger>
                      </div>

                      <MorphingDialogContainer>
                        <MorphingDialogContent className="bg-background border border-border p-8 max-w-2xl">
                          <MorphingDialogClose />

                          <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-left">
                                {testimonial.country}
                              </p>
                              <div className="flex gap-3 items-center">
                                {testimonial.image ? (
                                  <Image
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full object-cover"
                                    style={{ filter: "grayscale(100%)" }}
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-muted rounded-full" />
                                )}
                                <MorphingDialogTitle className="font-sans text-sm text-foreground">
                                  {testimonial.name}
                                </MorphingDialogTitle>
                              </div>
                            </div>

                            <div className="flex flex-col gap-6">
                              <MorphingDialogSubtitle className="font-sans text-sm text-muted-foreground">
                                {testimonial.company}
                              </MorphingDialogSubtitle>
                              {testimonial.video ? (
                                <div className="w-full overflow-hidden bg-muted">
                                  <video
                                    className="w-full h-auto"
                                    controls
                                    playsInline
                                    preload="metadata"
                                    poster={testimonial.videoPoster}
                                  >
                                    <source src={testimonial.video} />
                                    <track kind="captions" />
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ) : (
                                <MorphingDialogDescription
                                  disableLayoutAnimation
                                  variants={{
                                    initial: { opacity: 0, scale: 0.8, y: 100 },
                                    animate: { opacity: 1, scale: 1, y: 0 },
                                    exit: { opacity: 0, scale: 0.8, y: 100 },
                                  }}
                                  className="font-sans text-sm text-muted-foreground"
                                >
                                  {renderStructuredContent(
                                    testimonial.fullContent,
                                  )}
                                </MorphingDialogDescription>
                              )}
                            </div>
                          </div>
                        </MorphingDialogContent>
                      </MorphingDialogContainer>
                    </MorphingDialog>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="text-center mt-6 sm:mt-8">
          <Link
            href="/testimonials"
            className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            View all customer stories
          </Link>
        </div>
      </div>
    </section>
  );
}
