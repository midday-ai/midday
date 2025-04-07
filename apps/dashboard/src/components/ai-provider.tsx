"use client";

import { AI } from "@/actions/ai/chat";
import type { AIState, UIState } from "@/actions/ai/types";

interface AIProviderProps {
  children: React.ReactNode;
  initialState: AIState;
}

export function AIProvider({ children, initialState }: AIProviderProps) {
  return <AI initialAIState={initialState}>{children}</AI>;
}
