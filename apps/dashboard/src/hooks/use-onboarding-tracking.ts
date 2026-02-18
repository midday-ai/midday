"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { useCallback, useEffect, useRef } from "react";

type EventConfig = { name: string; channel: string };

type TrackableStep = {
  trackEvent?: EventConfig;
};

export function useOnboardingTracking(step: number) {
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    if (!hasTrackedStart.current) {
      track({
        event: LogEvents.OnboardingStarted.name,
        channel: LogEvents.OnboardingStarted.channel,
      });
      hasTrackedStart.current = true;
    }
  }, []);

  useEffect(() => {
    track({
      event: LogEvents.OnboardingStepViewed.name,
      channel: LogEvents.OnboardingStepViewed.channel,
      step,
    });
  }, [step]);

  const trackNavigation = useCallback(
    (currentStep: TrackableStep) => {
      if (currentStep.trackEvent) {
        track({
          event: currentStep.trackEvent.name,
          channel: currentStep.trackEvent.channel,
          step,
        });
      }
    },
    [step],
  );

  const trackEvent = useCallback(
    (event: EventConfig, props?: Record<string, unknown>) => {
      track({ event: event.name, channel: event.channel, ...props });
    },
    [],
  );

  return { trackNavigation, trackEvent };
}
