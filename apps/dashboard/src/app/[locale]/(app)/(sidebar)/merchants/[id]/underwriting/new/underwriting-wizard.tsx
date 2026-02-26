"use client";

import { useEffect } from "react";
import {
  UnderwritingWizardProvider,
  useUnderwritingWizard,
} from "./wizard-context";
import { WizardStepper } from "./wizard-stepper";
import { StepProfile } from "./steps/step-profile";
import { StepDocuments } from "./steps/step-documents";
import { StepReview } from "./steps/step-review";

type Merchant = {
  id: string;
  name: string | null;
  email: string;
  state: string | null;
};

function WizardContent({
  merchant,
  teamId,
}: { merchant: Merchant; teamId: string }) {
  const { state, steps, currentStepIndex, setStep } =
    useUnderwritingWizard();

  // Warn on unload if wizard has data
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.profile || state.applicationId) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.profile, state.applicationId]);

  return (
    <div className="space-y-6">
      <WizardStepper
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={setStep}
      />

      {state.currentStep === "profile" && (
        <div className="max-w-2xl">
          <StepProfile merchant={merchant} />
        </div>
      )}
      {state.currentStep === "documents" && (
        <div className="max-w-2xl">
          <StepDocuments
            merchantState={merchant.state}
            teamId={teamId}
          />
        </div>
      )}
      {state.currentStep === "review" && (
        <StepReview merchantId={merchant.id} />
      )}
    </div>
  );
}

export function UnderwritingWizard({
  merchant,
  teamId,
}: { merchant: Merchant; teamId: string }) {
  return (
    <UnderwritingWizardProvider
      initialProfile={{
        merchantId: merchant.id,
        merchantName: merchant.name || "",
      }}
    >
      <WizardContent merchant={merchant} teamId={teamId} />
    </UnderwritingWizardProvider>
  );
}
