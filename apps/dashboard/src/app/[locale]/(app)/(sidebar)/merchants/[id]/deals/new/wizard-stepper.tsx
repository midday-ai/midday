"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import type { WizardStep } from "./wizard-context";

const STEP_LABELS: Record<WizardStep, string> = {
  merchant: "Merchant",
  "bank-account": "Bank Account",
  "deal-terms": "Deal Terms",
  review: "Review",
};

type Props = {
  steps: WizardStep[];
  currentStepIndex: number;
  onStepClick: (step: WizardStep) => void;
};

export function WizardStepper({ steps, currentStepIndex, onStepClick }: Props) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isClickable = index < currentStepIndex;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step)}
              className={cn(
                "flex items-center gap-2 transition-colors",
                isClickable && "cursor-pointer hover:opacity-80",
                !isClickable && !isCurrent && "cursor-default",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-7 rounded-full text-xs font-medium transition-colors shrink-0",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <Icons.Check className="size-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap hidden sm:inline",
                  isCurrent && "font-medium text-primary",
                  isCompleted && "text-foreground",
                  !isCompleted &&
                    !isCurrent &&
                    "text-muted-foreground",
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </button>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-3",
                  index < currentStepIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
