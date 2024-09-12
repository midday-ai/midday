import { useState } from "react";

export type AIStateType = {
  isAiLoading: boolean;
  aiError?: string | null;

  setIsAiLoading: (isAiLoading: boolean) => void;
  setAiError: (aiError: string | null) => void;
};

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
