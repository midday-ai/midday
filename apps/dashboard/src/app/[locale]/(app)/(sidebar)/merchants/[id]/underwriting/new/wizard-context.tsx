"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import type {
  ProfileStepData,
  DocumentsStepData,
} from "./wizard-schemas";

export type UnderwritingWizardStep = "profile" | "documents" | "review";

const STEPS: UnderwritingWizardStep[] = ["profile", "documents", "review"];

type WizardState = {
  currentStep: UnderwritingWizardStep;
  profile: ProfileStepData | null;
  documents: DocumentsStepData | null;
  applicationId: string | null;
};

type WizardAction =
  | { type: "SET_STEP"; step: UnderwritingWizardStep }
  | { type: "SET_PROFILE"; data: ProfileStepData }
  | { type: "SET_DOCUMENTS"; data: DocumentsStepData }
  | { type: "SET_APPLICATION_ID"; applicationId: string }
  | { type: "RESET" };

const initialState: WizardState = {
  currentStep: "profile",
  profile: null,
  documents: null,
  applicationId: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "SET_PROFILE":
      return { ...state, profile: action.data };
    case "SET_DOCUMENTS":
      return { ...state, documents: action.data };
    case "SET_APPLICATION_ID":
      return { ...state, applicationId: action.applicationId };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

type WizardContextValue = {
  state: WizardState;
  steps: UnderwritingWizardStep[];
  currentStepIndex: number;
  setStep: (step: UnderwritingWizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setProfile: (data: ProfileStepData) => void;
  setDocuments: (data: DocumentsStepData) => void;
  setApplicationId: (applicationId: string) => void;
  reset: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function UnderwritingWizardProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile?: ProfileStepData;
}) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    profile: initialProfile || null,
  });

  const currentStepIndex = STEPS.indexOf(state.currentStep);

  const setStep = useCallback(
    (step: UnderwritingWizardStep) => dispatch({ type: "SET_STEP", step }),
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

  const setProfile = useCallback(
    (data: ProfileStepData) => dispatch({ type: "SET_PROFILE", data }),
    [],
  );

  const setDocuments = useCallback(
    (data: DocumentsStepData) => dispatch({ type: "SET_DOCUMENTS", data }),
    [],
  );

  const setApplicationId = useCallback(
    (applicationId: string) =>
      dispatch({ type: "SET_APPLICATION_ID", applicationId }),
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
        setProfile,
        setDocuments,
        setApplicationId,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useUnderwritingWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error(
      "useUnderwritingWizard must be used within UnderwritingWizardProvider",
    );
  }
  return ctx;
}
