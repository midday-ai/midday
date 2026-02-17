"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";

// Steps: 1 Profile, 2 CreateTeam, 3 ConnectBank, 4 ConnectInbox, 5 Reconciliation, 6 StartTrial
const TOTAL_STEPS = 6;

type OnboardingStepOptions = {
  hasTeam: boolean;
  hasFullName: boolean;
};

export function useOnboardingStep(opts: OnboardingStepOptions) {
  const [step, setStep] = useQueryState(
    "s",
    parseAsInteger.withDefault(1).withOptions({ history: "push" }),
  );

  // Determine the lowest step this user still needs:
  //   !hasFullName          → 1 (must complete profile)
  //   hasFullName && !hasTeam → 2 (must create team)
  //   hasFullName && hasTeam  → 3 (both done, start at connect bank)
  const minStep = !opts.hasFullName ? 1 : !opts.hasTeam ? 2 : 3;

  // Gate forward progress — can't skip past the step that's blocking:
  //   profile incomplete  → locked to step 1
  //   team not created    → locked to step 2
  //   both done           → full access
  const maxAllowedStep = !opts.hasFullName
    ? 1
    : !opts.hasTeam
      ? 2
      : TOTAL_STEPS;

  const safeStep = Math.max(minStep, Math.min(step, maxAllowedStep));

  useEffect(() => {
    if (step !== safeStep) {
      setStep(safeStep);
    }
  }, [step, safeStep, setStep]);

  const nextStep = () => {
    if (safeStep < TOTAL_STEPS) setStep(safeStep + 1);
  };

  const prevStep = () => {
    if (safeStep > minStep) setStep(safeStep - 1);
  };

  return {
    step: safeStep,
    setStep,
    nextStep,
    prevStep,
    totalSteps: TOTAL_STEPS,
  };
}
