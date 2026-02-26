"use client";

import { useEffect } from "react";
import { WizardProvider, useWizard } from "./wizard-context";
import { WizardStepper } from "./wizard-stepper";
import { StepBankAccount } from "./steps/step-bank-account";
import { StepDealTerms } from "./steps/step-deal-terms";
import { StepMerchant } from "./steps/step-merchant";
import { StepReview } from "./steps/step-review";

type Merchant = {
  id: string;
  name: string | null;
  email: string;
  website: string | null;
};

function WizardContent({ merchant }: { merchant: Merchant }) {
  const { state, steps, currentStepIndex, setStep } = useWizard();

  // Warn on unload if wizard has data
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (state.merchant || state.dealTerms) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.merchant, state.dealTerms]);

  return (
    <div className="space-y-6">
      <WizardStepper
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={setStep}
      />

      <div className="max-w-2xl">
        {state.currentStep === "merchant" && (
          <StepMerchant merchant={merchant} />
        )}
        {state.currentStep === "bank-account" && <StepBankAccount />}
        {state.currentStep === "deal-terms" && <StepDealTerms />}
        {state.currentStep === "review" && (
          <StepReview merchantId={merchant.id} />
        )}
      </div>
    </div>
  );
}

export function DealWizard({ merchant }: { merchant: Merchant }) {
  return (
    <WizardProvider
      initialMerchant={{
        merchantId: merchant.id,
        merchantName: merchant.name || "",
      }}
    >
      <WizardContent merchant={merchant} />
    </WizardProvider>
  );
}
