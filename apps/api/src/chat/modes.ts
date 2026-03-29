import { openai } from "@ai-sdk/openai";

export type ChatMode = "auto" | "instant" | "thinking";

export function resolveModel(mode: ChatMode, isComplex: boolean) {
  switch (mode) {
    case "instant":
      return { model: openai("gpt-5.4-nano"), reasoning: false };
    case "thinking":
      return { model: openai("o4-mini"), reasoning: true };
    default:
      return isComplex
        ? { model: openai("gpt-4.1"), reasoning: false }
        : { model: openai("gpt-5.4-nano"), reasoning: false };
  }
}
