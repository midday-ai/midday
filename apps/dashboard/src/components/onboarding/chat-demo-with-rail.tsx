"use client";

import type { ChatDemoScenario } from "@midday/ui/animations/chat-demo";
import { ChatIMessageAnimation } from "@midday/ui/animations/chat-demo";
import { ChatDemoRail, DEMO_STORIES } from "@midday/ui/chat-demo-rail";
import { IPhoneMock } from "@midday/ui/iphone-mock";
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

  const handleSelect = useCallback((id: ChatDemoScenario) => {
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    const idx = DEMO_STORIES.findIndex((s) => s.id === id);
    if (idx >= 0) {
      setScenarioIndex(idx);
      setPlaying(true);
      setHasPlayedOnce(true);
    }
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
            <ChatIMessageAnimation
              key={scenario.id}
              scenario={scenario.id}
              playing={playing}
              skipLockScreen={hasPlayedOnce}
              onComplete={handleComplete}
            />
          </IPhoneMock>
        </div>
      </div>

      <ChatDemoRail
        activeScenario={scenario.id}
        onSelect={handleSelect}
        size="sm"
        className="shrink-0 pb-2"
      />
    </div>
  );
}
