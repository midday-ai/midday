import { useState } from "react";

/**
 * Defines the structure for AI state management, including loading state and
 * potential error information.
 */
export type AIStateType = {
  /** Indicates whether the AI is currently loading. */
  isAiLoading: boolean;

  /**
   * Error message, if any, related to AI processing. Can be null if no error is
   * present.
   */
  aiError?: string | null;

  /**
   * Sets the loading state for the AI.
   *
   * @param isAiLoading - A boolean value to indicate whether the AI is
   *   currently loading.
   */
  setIsAiLoading: (isAiLoading: boolean) => void;

  /**
   * Sets the error message related to AI processing.
   *
   * @param aiError - A string containing the error message, or null if no error
   *   is to be set.
   */
  setAiError: (aiError: string | null) => void;
};

/**
 * A custom React hook for managing the state of an AI component, including
 * loading and error states.
 *
 * @returns An object containing the AI state and functions to modify that
 *   state.
 */
export const useAIState = (): AIStateType => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  return {
    isAiLoading,
    aiError,
    setIsAiLoading,
    setAiError,
  };
};
