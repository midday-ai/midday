"use client";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useInView } from "framer-motion";
import React, { useRef } from "react";

import { cn } from "../../utils/cn";
import { Button } from "../button";
import { BorderBeam } from "../magicui/border-beam";
import TextShimmer from "../magicui/text-shimmer";

/**
 * Props for the HeroSection component.
 * @interface HeroSectionProps
 */
interface HeroSectionProps {
  /** The main title of the hero section */
  title: string;
  /** The subtitle or description text */
  subtitle: string;
  /** The text for the call-to-action button */
  ctaText: string;
  /** The source URL for the dark mode hero image */
  darkImageSrc: string;
  /** The source URL for the light mode hero image */
  lightImageSrc: string;
  children?: React.ReactNode;
  announcement?: string;
  className?: string;
}

/**
 * HeroSection component for displaying a featured section on a landing page.
 * @param {HeroSectionProps} props - The props for the HeroSection component
 * @returns {JSX.Element} The rendered HeroSection component
 * 
 * @examples
 * import { HeroSection } from "@/components/landing/hero-section";
 * 
 * <HeroSection
    title="Magic UI is the new way to build landing pages."
    subtitle="Beautifully designed, animated components and templates built with Tailwind CSS, React, and Framer Motion."
    ctaText="Get Started for free"
    darkImageSrc="/hero-dark.png"
    lightImageSrc="/hero-light.png"
    />
 */
export default function HeroSection({
  title,
  subtitle,
  ctaText,
  darkImageSrc,
  lightImageSrc,
  children,
  announcement,
  className,
}: HeroSectionProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="hero"
      className={cn(
        "relative mx-auto mt-32 max-w-[80rem] px-6 text-center md:px-8",
        className,
      )}
    >
      {announcement && <AnnouncementBanner text={announcement} />}
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <div className="grid grid-cols-1 gap-1">
        <CTAButton>{ctaText}</CTAButton>
        {children}
      </div>

      {darkImageSrc && lightImageSrc ? (
        <HeroImage
          ref={ref}
          inView={inView}
          darkImageSrc={darkImageSrc}
          lightImageSrc={lightImageSrc}
        />
      ) : (
        <div className="animate-fade-up relative mt-[8rem] [--animation-delay:400ms] [perspective:2000px] after:absolute after:inset-0 after:z-50 after:[background:linear-gradient(to_top,hsl(var(--background))_30%,transparent)]"></div>
      )}
    </section>
  );
}

/**
 * AnnouncementBanner component for displaying a highlighted announcement.
 * @returns {JSX.Element} The rendered AnnouncementBanner component
 */
const AnnouncementBanner: React.FC<{
  text: string;
}> = ({ text }) => (
  <div className="backdrop-filter-[12px] animate-fade-in group inline-flex h-7 translate-y-[-1rem] items-center justify-between gap-1 rounded-full border border-white/5 bg-white/10 px-3 text-xs text-white transition-all ease-in hover:cursor-pointer hover:bg-white/20 dark:text-white">
    <TextShimmer className="inline-flex items-center justify-center">
      <span>✨ {text}</span>{" "}
      <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
    </TextShimmer>
  </div>
);

/**
 * Title component for displaying the main heading.
 * @param {Object} props - The props for the Title component
 * @param {React.ReactNode} props.children - The content to be displayed as the title
 * @returns {JSX.Element} The rendered Title component
 */
const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className="animate-fade-in translate-y-[-1rem] text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent [--animation-delay:200ms] dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl">
    {children}
  </h1>
);

/**
 * Subtitle component for displaying secondary text.
 * @param {Object} props - The props for the Subtitle component
 * @param {React.ReactNode} props.children - The content to be displayed as the subtitle
 * @returns {JSX.Element} The rendered Subtitle component
 */
const Subtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="animate-fade-in mb-12 translate-y-[-1rem] text-balance text-lg tracking-tight text-gray-400 [--animation-delay:400ms] md:text-xl">
    {children}
  </p>
);

/**
 * CTAButton component for displaying a call-to-action button.
 * @param {Object} props - The props for the CTAButton component
 * @param {React.ReactNode} props.children - The content to be displayed on the button
 * @returns {JSX.Element} The rendered CTAButton component
 */
const CTAButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-center">
    <Button
      className="animate-fade-in translate-y-[-1rem] items-center justify-center gap-1 rounded-lg text-white ease-in-out [--animation-delay:600ms] dark:text-white"
      variant={"ghost"}
    >
      <span>{children}</span>
      <ArrowRightIcon className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
    </Button>
  </div>
);

/**
 * Props for the HeroImage component.
 * @interface HeroImageProps
 */
interface HeroImageProps {
  /** Whether the component is in view */
  inView: boolean;
  /** The source URL for the dark mode image */
  darkImageSrc: string;
  /** The source URL for the light mode image */
  lightImageSrc: string;
}

/**
 * HeroImage component for displaying the main hero image.
 * @param {HeroImageProps} props - The props for the HeroImage component
 * @param {React.Ref<HTMLDivElement>} ref - The ref to be attached to the component
 * @returns {JSX.Element} The rendered HeroImage component
 */
export const HeroImage = React.forwardRef<HTMLDivElement, HeroImageProps>(
  ({ inView, darkImageSrc, lightImageSrc }, ref) => (
    <div
      ref={ref}
      className="animate-fade-up relative mt-[8rem] [--animation-delay:400ms] [perspective:2000px] after:absolute after:inset-0 after:z-50 after:[background:linear-gradient(to_top,hsl(var(--background))_30%,transparent)]"
    >
      <div
        className={`rounded-xl border border-white/10 bg-white bg-opacity-[0.01] before:absolute before:bottom-1/2 before:left-0 before:top-0 before:h-full before:w-full before:opacity-0 before:[background-image:linear-gradient(to_bottom,var(--color-one),var(--color-one),transparent_40%)] before:[filter:blur(180px)] ${
          inView ? "before:animate-image-glow" : ""
        }`}
      >
        <BorderBeam
          size={200}
          duration={12}
          delay={11}
          colorFrom="var(--color-one)"
          colorTo="var(--color-two)"
        />
        <img
          src={darkImageSrc}
          alt="Hero Image"
          className="relative hidden h-full w-full rounded-[inherit] border object-contain dark:block"
        />
        <img
          src={lightImageSrc}
          alt="Hero Image"
          className="relative block h-full w-full rounded-[inherit] border object-contain dark:hidden"
        />
      </div>
    </div>
  ),
);

HeroImage.displayName = "HeroImage";
