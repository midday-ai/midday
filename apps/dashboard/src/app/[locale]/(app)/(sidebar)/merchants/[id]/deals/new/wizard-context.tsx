"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import type {
  BankAccountStepData,
  DealTermsStepData,
  MerchantStepData,
} from "./wizard-schemas";

export type WizardStep = "merchant" | "bank-account" | "deal-terms" | "review";

const STEPS: WizardStep[] = [
  "merchant",
  "bank-account",
  "deal-terms",
  "review",
];

type WizardState = {
  currentStep: WizardStep;
  merchant: MerchantStepData | null;
  bankAccount: BankAccountStepData | null;
  dealTerms: DealTermsStepData | null;
};

type WizardAction =
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SET_MERCHANT"; data: MerchantStepData }
  | { type: "SET_BANK_ACCOUNT"; data: BankAccountStepData }
  | { type: "SET_DEAL_TERMS"; data: DealTermsStepData }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "SET_MERCHANT":
      return { ...state, merchant: action.data };
    case "SET_BANK_ACCOUNT":
      return { ...state, bankAccount: action.data };
    case "SET_DEAL_TERMS":
      return { ...state, dealTerms: action.data };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const initialState: WizardState = {
  currentStep: "merchant",
  merchant: null,
  bankAccount: null,
  dealTerms: null,
};

type WizardContextValue = {
  state: WizardState;
  steps: WizardStep[];
  currentStepIndex: number;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setMerchant: (data: MerchantStepData) => void;
  setBankAccount: (data: BankAccountStepData) => void;
  setDealTerms: (data: DealTermsStepData) => void;
  reset: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
  initialMerchant,
}: {
  children: ReactNode;
  initialMerchant?: MerchantStepData;
}) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    merchant: initialMerchant || null,
  });

  const currentStepIndex = STEPS.indexOf(state.currentStep);

  const setStep = useCallback(
    (step: WizardStep) => dispatch({ type: "SET_STEP", step }),
    [],
  );

  const nextStep = useCallback(() => {
    const idx = STEPS.indexOf(state.currentStep);
    if (idx < STEPS.length - 1) {
      dispatch({ type: "SET_STEP", step: STEPS[idx + 1]! });
    }
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    const idx = STEPS.indexOf(state.currentStep);
    if (idx > 0) {
      dispatch({ type: "SET_STEP", step: STEPS[idx - 1]! });
    }
  }, [state.currentStep]);

  const setMerchant = useCallback(
    (data: MerchantStepData) => dispatch({ type: "SET_MERCHANT", data }),
    [],
  );

  const setBankAccount = useCallback(
    (data: BankAccountStepData) =>
      dispatch({ type: "SET_BANK_ACCOUNT", data }),
    [],
  );

  const setDealTerms = useCallback(
    (data: DealTermsStepData) => dispatch({ type: "SET_DEAL_TERMS", data }),
    [],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <WizardContext.Provider
      value={{
        state,
        steps: STEPS,
        currentStepIndex,
        setStep,
        nextStep,
        prevStep,
        setMerchant,
        setBankAccount,
        setDealTerms,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return ctx;
}
