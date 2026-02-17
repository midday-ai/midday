"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";

const TOTAL_STEPS = 5;

type OnboardingStepOptions = {
  hasTeam: boolean;
};

export function useOnboardingStep(opts: OnboardingStepOptions) {
  const [step, setStep] = useQueryState(
    "s",
    parseAsInteger.withDefault(1).withOptions({ history: "push" }),
  );

  const maxAllowedStep = !opts.hasTeam ? 1 : TOTAL_STEPS;

  const safeStep = Math.max(1, Math.min(step, maxAllowedStep));

  useEffect(() => {
    if (step !== safeStep) {
      setStep(safeStep);
    }
  }, [step, safeStep, setStep]);

  const nextStep = () => {
    if (safeStep < TOTAL_STEPS) setStep(safeStep + 1);
  };

  const minStep = opts.hasTeam ? 2 : 1;

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
