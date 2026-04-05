"use client";

import { Icons } from "@midday/ui/icons";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  type ChatDemoScenario,
  ChatIMessageAnimation,
} from "./chat-imessage-animation";
import { IPhoneMock } from "./iphone-mock";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { TextMorph } from "./text-morph";

const PHONE_W = 418;
const PHONE_H = 890;
const MOBILE_SCALE = 0.6;
const DESKTOP_STORY_SCALE = 0.86;
const MOBILE_FRAME_GUTTER = 8;
const DESKTOP_FRAME_GUTTER = 36;
const HERO_CHAT_PLATFORMS = ["iMessage", "WhatsApp", "Slack", "Telegram"] as const;

const DEMO_STORIES: Array<{
  id: ChatDemoScenario;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "reminder",
    label: "Push notification",
    title: "Catch overdue invoices right from a notification",
    description:
      "Start on the lock screen, open Midday from the push, and send a reminder without breaking focus.",
    bullets: [
      "Lock-screen alert opens directly into the iMessage thread.",
      "Midday drafts the reminder and sends the payment link automatically.",
      "Perfect for chasing cash the moment an invoice goes overdue.",
    ],
    icon: Icons.Notifications,
  },
  {
    id: "create-invoice",
    label: "Create invoice",
    title: "Draft and send invoices from the chat itself",
    description:
      "Turn a plain-language instruction into a polished invoice, then send it immediately from the same thread.",
    bullets: [
      "Convert billable work into a ready-to-send invoice in seconds.",
      "Keep everything in context instead of jumping back to the dashboard.",
      "Ideal for founders who invoice between meetings.",
    ],
    icon: Icons.Invoice,
  },
  {
    id: "receipt-match",
    label: "Receipt match",
    title: "Upload a receipt and let Midday match the transaction",
    description:
      "Drop a receipt photo into the conversation and get back the exact card transaction it belongs to.",
    bullets: [
      "Receipt upload gets recognized inside the thread.",
      "Midday finds the matching transaction automatically.",
      "A fast way to keep expenses reconciled without inbox cleanup.",
    ],
    icon: Icons.ReceiptLong,
  },
  {
    id: "latest-transactions",
    label: "Latest transactions",
    title: "Ask for the latest activity and spot anything unusual",
    description:
      "Get the newest transactions in a compact summary and ask follow-up questions without leaving chat.",
    bullets: [
      "See recent spend and payouts in one answer.",
      "Ask Midday to flag anomalies or explain changes instantly.",
      "Useful when you want a quick financial pulse check on the go.",
    ],
    icon: Icons.Transactions,
  },
];

const CHAT_PLATFORM_LINKS = [
  { href: "/chat/imessage", label: "iMessage", Icon: Icons.IMessage },
  { href: "/chat/whatsapp", label: "WhatsApp", Icon: Icons.WhatsApp },
  { href: "/chat/slack", label: "Slack", Icon: Icons.Slack },
  { href: "/chat/telegram", label: "Telegram", Icon: Icons.Telegram },
] as const;

function PlatformIcons() {
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <div className="flex items-center gap-2.5">
        {CHAT_PLATFORM_LINKS.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            aria-label={label}
            className="opacity-40 transition-all duration-200 hover:opacity-100"
          >
            <Icon className="h-[18px] w-[18px] grayscale saturate-0 brightness-90 contrast-75 transition-all duration-200 hover:grayscale-0 hover:saturate-100 hover:brightness-100 hover:contrast-100" />
          </a>
        ))}
      </div>
    </div>
  );
}

function PhoneMock({
  isDark,
  scenario,
  playing,
}: {
  isDark: boolean;
  scenario: ChatDemoScenario;
  playing: boolean;
}) {
  return (
    <IPhoneMock isDark={isDark}>
      <ChatIMessageAnimation scenario={scenario} playing={playing} />
    </IPhoneMock>
  );
}

function DemoRail({
  activeScenario,
  onSelect,
  className,
}: {
  activeScenario: ChatDemoScenario;
  onSelect: (scenario: ChatDemoScenario) => void;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ y: 18, opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
        mass: 0.95,
      }}
    >
      <div className="pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-1 overflow-x-auto border border-black/5 bg-[rgba(247,247,247,0.98)] p-1 backdrop-blur-[18px] sm:gap-1 sm:p-1.5 dark:border-white/8 dark:bg-[rgba(19,19,19,0.98)]">
        {DEMO_STORIES.map((story) => {
          const Icon = story.icon;
          const isActive = activeScenario === story.id;

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => onSelect(story.id)}
              className={`flex shrink-0 items-center gap-2 px-2.5 py-1.5 font-sans text-sm transition-colors sm:px-3 sm:py-1.5 ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              <span className="whitespace-nowrap font-medium">
                {story.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function DemoSetupCta({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12, scale: 0.985, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        stiffness: 340,
        damping: 26,
        mass: 0.72,
      }}
    >
      <div className="bg-[rgba(247,247,247,0.98)] p-4 backdrop-blur-[18px] dark:bg-[rgba(19,19,19,0.98)]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h3 className="font-sans text-sm font-medium text-foreground">
              Set up your company
            </h3>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              Start with chat, invoices, receipts, and notifications in minutes.
            </p>
          </div>

          <a
            href="https://app.midday.ai"
            className="inline-flex items-center justify-center bg-foreground px-4 py-2 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export function Chat() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [heroPlatformIndex, setHeroPlatformIndex] = useState(0);
  const [activeScenario, setActiveScenario] =
    useState<ChatDemoScenario>("reminder");
  const [demoActive, setDemoActive] = useState(false);
  const [hasExitedDemo, setHasExitedDemo] = useState(false);
  const sectionRefs = useRef<
    Partial<Record<ChatDemoScenario, HTMLElement | null>>
  >({});
  const demoSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroPlatformIndex((current) => (current + 1) % HERO_CHAT_PLATFORMS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const currentHeroPlatform = mounted
    ? (HERO_CHAT_PLATFORMS[heroPlatformIndex] ?? HERO_CHAT_PLATFORMS[0])
    : HERO_CHAT_PLATFORMS[0];
  const showDemoSetupCta =
    hasExitedDemo && activeScenario === "latest-transactions";

  useEffect(() => {
    const handleScroll = () => {
      const section = demoSectionRef.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      setDemoActive(rect.top <= 100);
      setHasExitedDemo(rect.bottom <= window.innerHeight + 16);

      const viewportAnchor = window.innerHeight * 0.56;
      let closestScenario = DEMO_STORIES[0]?.id ?? "reminder";
      let closestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < DEMO_STORIES.length; i++) {
        const story = DEMO_STORIES[i];

        if (!story) {
          continue;
        }

        const node = sectionRefs.current[story.id];

        if (!node) {
          continue;
        }

        const storyRect = node.getBoundingClientRect();
        const distance =
          viewportAnchor < storyRect.top
            ? storyRect.top - viewportAnchor
            : viewportAnchor > storyRect.bottom
              ? viewportAnchor - storyRect.bottom
              : 0;

        if (distance < closestDistance) {
          closestDistance = distance;
          closestScenario = story.id;
        }
      }

      setActiveScenario(closestScenario);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToScenario = (scenario: ChatDemoScenario) => {
    sectionRefs.current[scenario]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-background relative overflow-visible">
        <div className="flex flex-col relative pt-32 pb-0 md:pt-24 lg:pt-0">
          <div className="flex-1 lg:flex-none flex flex-col justify-center md:justify-start lg:pt-48 items-center space-y-8 lg:space-y-0 z-20 px-3 sm:px-4 lg:px-0 lg:max-w-[1400px] lg:mx-auto lg:w-full lg:mb-8">
            <div className="flex flex-col items-center w-full text-center space-y-6 lg:space-y-8">
              <div className="space-y-5 lg:space-y-6 max-w-3xl 3xl:max-w-5xl mx-auto px-2 lg:px-0">
                <h1 className="font-serif text-3xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl 2xl:text-7xl 3xl:text-8xl leading-[1.1] tracking-tight text-foreground">
                  <span className="block">Run your business</span>
                  <span className="mt-[0.08em] block">
                    from{" "}
                    <TextMorph
                      as="span"
                      className="align-baseline"
                      children={currentHeroPlatform ?? HERO_CHAT_PLATFORMS[0]}
                      preserveSpace={HERO_CHAT_PLATFORMS as unknown as string[]}
                      transition={{ type: "spring", stiffness: 280, damping: 18, mass: 0.3 }}
                    />
                  </span>
                </h1>

                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed font-sans max-w-xl mx-auto">
                  Everything Midday, right from chat.
                </p>

                <div className="flex justify-center pt-1">
                  <a
                    href="https://app.midday.ai/apps?app=sendblue"
                    className="inline-flex items-center justify-center bg-foreground px-5 py-2.5 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Set up your company
                  </a>
                </div>
              </div>

              <PlatformIcons />
            </div>
          </div>
        </div>
      </div>

      <section ref={demoSectionRef} className="relative pb-24 pt-6 lg:pt-0">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8">
          <div className="relative">
            <div className="sticky top-20 z-20 flex flex-col items-center gap-4 sm:gap-5">
              <div className="flex w-full justify-center">
                <div className="lg:hidden">
                  <div
                    className="relative"
                    style={{
                      width:
                        Math.round(PHONE_W * MOBILE_SCALE) +
                        MOBILE_FRAME_GUTTER * 2,
                      height:
                        Math.round(PHONE_H * MOBILE_SCALE) +
                        MOBILE_FRAME_GUTTER,
                    }}
                  >
                    <div
                      className="absolute top-0 origin-top-left"
                      style={{
                        left: MOBILE_FRAME_GUTTER,
                        transform: `scale(${MOBILE_SCALE})`,
                      }}
                    >
                      <PhoneMock
                        isDark={isDark}
                        scenario={activeScenario}
                        playing={demoActive}
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div
                    className="relative"
                    style={{
                      width:
                        Math.round(PHONE_W * DESKTOP_STORY_SCALE) +
                        DESKTOP_FRAME_GUTTER * 2,
                      height:
                        Math.round(PHONE_H * DESKTOP_STORY_SCALE) +
                        DESKTOP_FRAME_GUTTER,
                    }}
                  >
                    <div
                      className="absolute top-0 origin-top-left"
                      style={{
                        left: DESKTOP_FRAME_GUTTER,
                        transform: `scale(${DESKTOP_STORY_SCALE})`,
                      }}
                    >
                      <PhoneMock
                        isDark={isDark}
                        scenario={activeScenario}
                        playing={demoActive}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {hasExitedDemo ? (
                <DemoRail
                  activeScenario={activeScenario}
                  onSelect={scrollToScenario}
                  className="flex justify-center px-3 sm:px-4 lg:px-6"
                />
              ) : null}
            </div>

            <div className="relative -mt-[48vh] pb-20 pt-[56vh] lg:-mt-[58vh] lg:pb-32 lg:pt-[66vh]">
              {DEMO_STORIES.map((story) => (
                <article
                  key={story.id}
                  ref={(node) => {
                    sectionRefs.current[story.id] = node;
                  }}
                  data-scenario={story.id}
                  className="min-h-[78vh] lg:min-h-[100vh]"
                  style={{ scrollMarginTop: 120 }}
                  aria-label={story.title}
                >
                  <div className="sr-only">
                    <h2>{story.title}</h2>
                    <p>{story.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!hasExitedDemo ? (
        <DemoRail
          activeScenario={activeScenario}
          onSelect={scrollToScenario}
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 sm:px-4 lg:px-6"
        />
      ) : null}

      {showDemoSetupCta ? (
        <DemoSetupCta className="fixed bottom-4 right-4 z-50 w-[min(280px,calc(100vw-1.5rem))]" />
      ) : null}

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <FeaturesGridSection />

      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <TestimonialsSection />

      <div className="max-w-[1400px] mx-auto">
        <div className="h-px w-full border-t border-border" />
      </div>

      <PricingSection />
    </div>
  );
}
