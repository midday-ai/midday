"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IPhoneMock } from "../iphone-mock";
import type { ChatDemoScenario } from "./chat-demo-animation";
import { ChatIMessageAnimation } from "./chat-demo-animation";

const SCENARIOS: ChatDemoScenario[] = [
  "reminder",
  "create-invoice",
  "receipt-match",
  "latest-transactions",
];

const PAUSE_BETWEEN_SCENARIOS_MS = 1500;

export function ChatDemoAutoplay({ className }: { className?: string }) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [startAtEnd, setStartAtEnd] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToPreviousScenario = useCallback(() => {
    if (scenarioIndex <= 0) {
      return;
    }

    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    setPlaying(false);
    setStartAtEnd(true);
    setScenarioIndex((prev) => Math.max(prev - 1, 0));

    pauseTimerRef.current = setTimeout(() => {
      setPlaying(true);
      pauseTimerRef.current = null;
    }, 60);
  }, [scenarioIndex]);

  const handleComplete = useCallback(() => {
    setPlaying(false);
    setStartAtEnd(false);

    pauseTimerRef.current = setTimeout(() => {
      setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
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

  const scenario = SCENARIOS[scenarioIndex]!;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <IPhoneMock
        className="shrink-0"
        style={{
          transform: "scale(0.62)",
          transformOrigin: "center",
        }}
      >
        <ChatIMessageAnimation
          key={`${scenario}-${startAtEnd ? "end" : "start"}`}
          scenario={scenario}
          playing={playing}
          startAtEnd={startAtEnd}
          onComplete={handleComplete}
          onBackTap={goToPreviousScenario}
        />
      </IPhoneMock>
    </div>
  );
}
