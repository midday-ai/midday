"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";

const STEP_KEYS = [
  "set-name",
  "create-team",
  "connect-bank",
  "connect-inbox",
  "reconciliation",
  "start-trial",
] as const;

export type OnboardingStepKey = (typeof STEP_KEYS)[number];

type OnboardingStepOptions = {
  hasTeam: boolean;
  hasFullName: boolean;
};

function keyToIndex(key: string | null): number {
  if (!key) return -1;
  return STEP_KEYS.indexOf(key as OnboardingStepKey);
}

export function useOnboardingStep(opts: OnboardingStepOptions) {
  const [stepKey, setStepKey] = useQueryState(
    "s",
    parseAsString.withOptions({ history: "push" }),
  );

  const minKey: OnboardingStepKey = !opts.hasFullName
    ? "set-name"
    : "create-team";

  const maxKey: OnboardingStepKey = !opts.hasFullName
    ? "set-name"
    : !opts.hasTeam
      ? "create-team"
      : "start-trial";

  const minIndex = keyToIndex(minKey);
  const maxIndex = keyToIndex(maxKey);
  const requestedIndex = keyToIndex(stepKey);

  const safeIndex =
    requestedIndex === -1
      ? minIndex
      : Math.max(minIndex, Math.min(requestedIndex, maxIndex));

  const safeKey = STEP_KEYS[safeIndex] as OnboardingStepKey;

  useEffect(() => {
    if (stepKey !== safeKey) {
      setStepKey(safeKey);
    }
  }, [stepKey, safeKey, setStepKey]);

  const step = safeIndex + 1;

  const nextStep = () => {
    if (safeIndex < STEP_KEYS.length - 1) {
      setStepKey(STEP_KEYS[safeIndex + 1] as string);
    }
  };

  const prevStep = () => {
    if (safeIndex > minIndex) {
      setStepKey(STEP_KEYS[safeIndex - 1] as string);
    }
  };

  return {
    step,
    stepKey: safeKey,
    nextStep,
    prevStep,
    totalSteps: STEP_KEYS.length,
  };
}
