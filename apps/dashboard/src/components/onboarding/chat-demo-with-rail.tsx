"use client";

import { ChatIMessageAnimation } from "@midday/ui/animations/chat-demo";
import { DEMO_STORIES } from "@midday/ui/chat-demo-rail";
import { IPhoneMock } from "@midday/ui/iphone-mock";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const PAUSE_BETWEEN_SCENARIOS_MS = 1500;

export function ChatDemoWithRail() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = DEMO_STORIES[scenarioIndex]!;

  const handleComplete = useCallback(() => {
    setHasPlayedOnce(true);

    pauseTimerRef.current = setTimeout(() => {
      setScenarioIndex((prev) => (prev + 1) % DEMO_STORIES.length);
      pauseTimerRef.current = null;
    }, PAUSE_BETWEEN_SCENARIOS_MS);
  }, []);

  useEffect(() => {
    setPlaying(true);
  }, [scenarioIndex]);

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
          style={{
            width: 418,
            height: 890,
            transform: "scale(0.72)",
            transformOrigin: "center",
          }}
        >
          <IPhoneMock>
            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <ChatIMessageAnimation
                  scenario={scenario.id}
                  playing={playing}
                  skipLockScreen={hasPlayedOnce}
                  onComplete={handleComplete}
                />
              </motion.div>
            </AnimatePresence>
          </IPhoneMock>
        </div>
      </div>

      <div className="shrink-0 pb-2 flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={scenario.id}
            initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-xs font-medium text-muted-foreground"
          >
            {scenario.label}
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
