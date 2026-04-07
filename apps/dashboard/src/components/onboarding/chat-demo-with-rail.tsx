"use client";

import type { ChatDemoScenario } from "@midday/ui/animations/chat-demo";
import { ChatIMessageAnimation } from "@midday/ui/animations/chat-demo";
import { DEMO_STORIES } from "@midday/ui/chat-demo-rail";
import { IPhoneMock } from "@midday/ui/iphone-mock";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const PHONE_W = 418;
const PHONE_H = 890;
const SCALE = 0.72;
const PAUSE_BETWEEN_SCENARIOS_MS = 1500;

export function ChatDemoWithRail() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [startAtEnd, setStartAtEnd] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario: ChatDemoScenario =
    DEMO_STORIES[scenarioIndex]?.id ?? "reminder";
  const label = DEMO_STORIES[scenarioIndex]?.label ?? "";

  const handleComplete = useCallback(() => {
    setPlaying(false);
    setStartAtEnd(false);

    pauseTimerRef.current = setTimeout(() => {
      setScenarioIndex((prev) => (prev + 1) % DEMO_STORIES.length);
      setPlaying(true);
      pauseTimerRef.current = null;
    }, PAUSE_BETWEEN_SCENARIOS_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current !== null) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      <div className="flex-1 flex items-center justify-center min-h-0 pb-4">
        <div
          className="relative"
          style={{
            width: Math.round(PHONE_W * SCALE),
            height: Math.round(PHONE_H * SCALE),
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `scale(${SCALE})` }}
          >
            <IPhoneMock>
              <ChatIMessageAnimation
                key={`${scenario}-${startAtEnd ? "end" : "start"}`}
                scenario={scenario}
                playing={playing}
                startAtEnd={startAtEnd}
                onComplete={handleComplete}
              />
            </IPhoneMock>
          </div>
        </div>
      </div>

      <div className="shrink-0 pb-2 flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={scenario}
            initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-xs font-medium text-muted-foreground"
          >
            {label}
          </motion.span>
        </AnimatePresence>

        <div className="flex items-center gap-1.5">
          {DEMO_STORIES.map((story, i) => (
            <motion.div
              key={story.id}
              className={`h-1.5 rounded-full ${
                i === scenarioIndex ? "bg-foreground" : "bg-foreground/20"
              }`}
              animate={{ width: i === scenarioIndex ? 16 : 6 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
