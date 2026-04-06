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
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleComplete = useCallback(() => {
    setPlaying(false);

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
          scenario={scenario}
          playing={playing}
          onComplete={handleComplete}
        />
      </IPhoneMock>
    </div>
  );
}
