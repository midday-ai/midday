import type { StepResult } from "ai";

/**
 * Utility functions for handling streaming tool responses
 */

/**
 * Checks if any tool has completed its full streaming response
 * This is used to force stop the main LLM from generating additional content
 * when a tool has already provided a complete response
 */
export const shouldForceStop = (step: {
  steps?: StepResult<any>[];
}): boolean => {
  return (
    step.steps?.some((stepResult) => {
      return stepResult.content?.some((contentItem) => {
        if (contentItem.type === "tool-result") {
          // Check if the tool result indicates it wants to force stop the LLM
          return (
            (contentItem as any).result?.forceStop === true ||
            (contentItem as any).output?.forceStop === true
          );
        }
        return false;
      });
    }) ?? false
  );
};
