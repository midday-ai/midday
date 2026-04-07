"use client";

import {
  type ChatDemoScenario,
  ChatIMessageAnimation,
} from "@midday/ui/animations/chat-demo";
import { ChatDemoRail, DEMO_STORIES } from "@midday/ui/chat-demo-rail";
import { Icons } from "@midday/ui/icons";
import { IPhoneMock } from "@midday/ui/iphone-mock";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeaturesGridSection } from "./sections/features-grid-section";
import { PricingSection } from "./sections/pricing-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { TextMorph } from "./text-morph";

const PHONE_W = 418;
const PHONE_H = 890;
const MOBILE_SCALE = 0.66;
const DESKTOP_STORY_SCALE = 0.86;
const MOBILE_FRAME_GUTTER = 8;
const DESKTOP_FRAME_GUTTER = 36;
const MOBILE_PHONE_MIN_SCALE = 0.44;
const MOBILE_PHONE_SAFE_X = 24;
const MOBILE_PHONE_SAFE_Y = 120;
const HERO_CHAT_PLATFORMS = [
  "iMessage",
  "WhatsApp",
  "Slack",
  "Telegram",
] as const;

const DEMO_STORY_META: Record<
  ChatDemoScenario,
  { title: string; description: string; bullets: string[] }
> = {
  reminder: {
    title: "Catch overdue invoices right from a notification",
    description:
      "Start on the lock screen, open Midday from the push, and send a reminder without breaking focus.",
    bullets: [
      "Lock-screen alert opens directly into the iMessage thread.",
      "Midday drafts the reminder and sends the payment link automatically.",
      "Perfect for chasing cash the moment an invoice goes overdue.",
    ],
  },
  "create-invoice": {
    title: "Draft and send invoices from the chat itself",
    description:
      "Turn a plain-language instruction into a polished invoice, then send it immediately from the same thread.",
    bullets: [
      "Convert billable work into a ready-to-send invoice in seconds.",
      "Keep everything in context instead of jumping back to the dashboard.",
      "Ideal for founders who invoice between meetings.",
    ],
  },
  "receipt-match": {
    title: "Upload a receipt and let Midday match the transaction",
    description:
      "Drop a receipt photo into the conversation and get back the exact card transaction it belongs to.",
    bullets: [
      "Receipt upload gets recognized inside the thread.",
      "Midday finds the matching transaction automatically.",
      "A fast way to keep expenses reconciled without inbox cleanup.",
    ],
  },
  "latest-transactions": {
    title: "Ask for the latest activity and spot anything unusual",
    description:
      "Get the newest transactions in a compact summary and ask follow-up questions without leaving chat.",
    bullets: [
      "See recent spend and payouts in one answer.",
      "Ask Midday to flag anomalies or explain changes instantly.",
      "Useful when you want a quick financial pulse check on the go.",
    ],
  },
};

const CHAT_PLATFORM_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  Icon: typeof Icons.IMessage;
  iconClassName?: string;
}> = [
  { href: "/chat/imessage", label: "iMessage", Icon: Icons.IMessage },
  { href: "/chat/slack", label: "Slack", Icon: Icons.Slack },
  {
    href: "/chat/whatsapp",
    label: "WhatsApp",
    Icon: Icons.WhatsApp,
    iconClassName: "hover:text-[#25D366]",
  },
  { href: "/chat/telegram", label: "Telegram", Icon: Icons.Telegram },
];

function PlatformIcons() {
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <div className="flex items-center gap-2.5">
        {CHAT_PLATFORM_LINKS.map(({ href, label, Icon, iconClassName }) => (
          <a
            key={href}
            href={href}
            aria-label={label}
            className="opacity-40 transition-all duration-200 hover:opacity-100"
          >
            <Icon
              className={[
                "h-[18px] w-[18px] grayscale saturate-0 brightness-90 contrast-75 transition-all duration-200 hover:grayscale-0 hover:saturate-100 hover:brightness-100 hover:contrast-100",
                iconClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            />
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
  onBackTap,
  startAtEnd,
}: {
  isDark: boolean;
  scenario: ChatDemoScenario;
  playing: boolean;
  onBackTap?: () => void;
  startAtEnd?: boolean;
}) {
  return (
    <IPhoneMock isDark={isDark}>
      <ChatIMessageAnimation
        key={`${scenario}-${startAtEnd ? "end" : "start"}`}
        scenario={scenario}
        playing={playing}
        startAtEnd={startAtEnd}
        onBackTap={onBackTap}
      />
    </IPhoneMock>
  );
}

export function Chat() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileScale, setMobileScale] = useState(MOBILE_SCALE);
  const [mobileScenarioIndex, setMobileScenarioIndex] = useState(0);
  const [mobilePlaying, setMobilePlaying] = useState(true);
  const [mobileStartAtEnd, setMobileStartAtEnd] = useState(false);
  const [heroPlatformIndex, setHeroPlatformIndex] = useState(0);
  const [activeScenario, setActiveScenario] =
    useState<ChatDemoScenario>("reminder");
  const [demoActive, setDemoActive] = useState(false);
  const [hasExitedDemo, setHasExitedDemo] = useState(false);
  const [desktopStartAtEndScenario, setDesktopStartAtEndScenario] =
    useState<ChatDemoScenario | null>(null);
  const mobilePauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const sectionRefs = useRef<
    Partial<Record<ChatDemoScenario, HTMLElement | null>>
  >({});
  const demoSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateMobileScale = () => {
      setIsMobileViewport(window.innerWidth < 1024);

      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const availableWidth =
        viewportWidth - MOBILE_PHONE_SAFE_X - MOBILE_FRAME_GUTTER * 2;
      const availableHeight =
        viewportHeight - MOBILE_PHONE_SAFE_Y - MOBILE_FRAME_GUTTER;

      const widthScale = availableWidth / PHONE_W;
      const heightScale = availableHeight / PHONE_H;

      setMobileScale(
        Math.max(
          MOBILE_PHONE_MIN_SCALE,
          Math.min(MOBILE_SCALE, widthScale, heightScale),
        ),
      );
    };

    updateMobileScale();
    window.addEventListener("resize", updateMobileScale);
    window.visualViewport?.addEventListener("resize", updateMobileScale);
    window.visualViewport?.addEventListener("scroll", updateMobileScale);

    return () => {
      window.removeEventListener("resize", updateMobileScale);
      window.visualViewport?.removeEventListener("resize", updateMobileScale);
      window.visualViewport?.removeEventListener("scroll", updateMobileScale);
    };
  }, []);

  const handleMobileComplete = useCallback(() => {
    setMobilePlaying(false);
    setMobileStartAtEnd(false);

    mobilePauseTimerRef.current = setTimeout(() => {
      setMobileScenarioIndex((prev) => (prev + 1) % DEMO_STORIES.length);
      setMobilePlaying(true);
      mobilePauseTimerRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (mobilePauseTimerRef.current !== null) {
        clearTimeout(mobilePauseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroPlatformIndex(
        (current) => (current + 1) % HERO_CHAT_PLATFORMS.length,
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const currentHeroPlatform = mounted
    ? (HERO_CHAT_PLATFORMS[heroPlatformIndex] ?? HERO_CHAT_PLATFORMS[0])
    : HERO_CHAT_PLATFORMS[0];
  const mobileScenario = DEMO_STORIES[mobileScenarioIndex]?.id ?? "reminder";
  useEffect(() => {
    if (isMobileViewport) {
      setDemoActive(false);
      setHasExitedDemo(false);
      return;
    }

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
  }, [isMobileViewport]);

  const scrollToScenario = (scenario: ChatDemoScenario) => {
    sectionRefs.current[scenario]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const getPreviousScenario = useCallback((current: ChatDemoScenario) => {
    const currentIndex = DEMO_STORIES.findIndex(
      (story) => story.id === current,
    );
    if (currentIndex <= 0) return null;
    return DEMO_STORIES[currentIndex - 1]?.id ?? null;
  }, []);

  const handleMobileBackTap = useCallback(() => {
    const previousScenario = getPreviousScenario(mobileScenario);
    if (!previousScenario) return;
    selectMobileScenario(previousScenario, { startAtEnd: true });
  }, [getPreviousScenario, mobileScenario]);

  const handleDesktopBackTap = useCallback(() => {
    const previousScenario = getPreviousScenario(activeScenario);
    if (!previousScenario) return;
    setDesktopStartAtEndScenario(previousScenario);
    scrollToScenario(previousScenario);
  }, [activeScenario, getPreviousScenario]);

  useEffect(() => {
    if (
      desktopStartAtEndScenario &&
      activeScenario === desktopStartAtEndScenario
    ) {
      setDesktopStartAtEndScenario(null);
    }
  }, [activeScenario, desktopStartAtEndScenario]);

  const selectMobileScenario = (
    scenario: ChatDemoScenario,
    options?: { startAtEnd?: boolean },
  ) => {
    if (mobilePauseTimerRef.current !== null) {
      clearTimeout(mobilePauseTimerRef.current);
      mobilePauseTimerRef.current = null;
    }

    const nextIndex = DEMO_STORIES.findIndex((story) => story.id === scenario);

    if (nextIndex >= 0) {
      setMobileStartAtEnd(options?.startAtEnd ?? false);
      setMobileScenarioIndex(nextIndex);
      setMobilePlaying(true);
    }
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
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 18,
                        mass: 0.3,
                      }}
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

      {isMobileViewport && (
        <section className="relative pb-12 pt-6 lg:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-3 sm:px-4">
            <div
              className="relative flex w-full justify-center"
              style={{
                height: Math.round(PHONE_H * mobileScale) + MOBILE_FRAME_GUTTER,
              }}
            >
              <div
                className="relative"
                style={{
                  width:
                    Math.round(PHONE_W * mobileScale) + MOBILE_FRAME_GUTTER * 2,
                  height:
                    Math.round(PHONE_H * mobileScale) + MOBILE_FRAME_GUTTER,
                }}
              >
                <div
                  className="absolute top-0 origin-top-left"
                  style={{
                    left: MOBILE_FRAME_GUTTER,
                    transform: `scale(${mobileScale})`,
                  }}
                >
                  <IPhoneMock isDark={isDark}>
                    <ChatIMessageAnimation
                      key={`${mobileScenario}-${mobileStartAtEnd ? "end" : "start"}`}
                      scenario={mobileScenario}
                      playing={mobilePlaying}
                      startAtEnd={mobileStartAtEnd}
                      onComplete={handleMobileComplete}
                      onBackTap={handleMobileBackTap}
                    />
                  </IPhoneMock>
                </div>
              </div>
            </div>

            <div className="shrink-0 pb-1 flex flex-col items-center gap-3">
              <motion.span
                key={mobileScenario}
                initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="text-xs font-medium text-muted-foreground"
              >
                {DEMO_STORIES[mobileScenarioIndex]?.label}
              </motion.span>

              <div className="flex items-center gap-1.5">
                {DEMO_STORIES.map((story, i) => (
                  <button
                    key={story.id}
                    type="button"
                    aria-label={story.label}
                    onClick={() => selectMobileScenario(story.id)}
                    className="flex items-center"
                  >
                    <motion.div
                      className={`h-1.5 rounded-full ${
                        i === mobileScenarioIndex
                          ? "bg-foreground"
                          : "bg-foreground/20"
                      }`}
                      animate={{ width: i === mobileScenarioIndex ? 16 : 6 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {!isMobileViewport && (
        <section
          ref={demoSectionRef}
          className="relative hidden pb-24 pt-6 lg:block lg:pt-0"
        >
          <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8">
            <div className="relative">
              <div className="sticky top-20 z-20 flex flex-col items-center gap-4 sm:gap-5">
                <div className="flex w-full justify-center">
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
                        startAtEnd={
                          desktopStartAtEndScenario === activeScenario
                        }
                        onBackTap={handleDesktopBackTap}
                      />
                    </div>
                  </div>
                </div>

                {hasExitedDemo ? (
                  <ChatDemoRail
                    activeScenario={activeScenario}
                    onSelect={scrollToScenario}
                    className="flex justify-center px-3 sm:px-4 lg:px-6"
                  />
                ) : null}
              </div>

              <div className="relative -mt-[58vh] pb-32 pt-[66vh]">
                {DEMO_STORIES.map((story) => {
                  const meta = DEMO_STORY_META[story.id];
                  return (
                    <article
                      key={story.id}
                      ref={(node) => {
                        sectionRefs.current[story.id] = node;
                      }}
                      data-scenario={story.id}
                      className="min-h-[100vh]"
                      style={{ scrollMarginTop: 120 }}
                      aria-label={meta.title}
                    >
                      <div className="sr-only">
                        <h2>{meta.title}</h2>
                        <p>{meta.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {!hasExitedDemo ? (
        <ChatDemoRail
          activeScenario={activeScenario}
          onSelect={scrollToScenario}
          className="hidden lg:flex fixed inset-x-0 bottom-4 z-50 justify-center px-3 sm:px-4 lg:px-6"
        />
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
