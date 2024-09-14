import React from "react";
import { MelodyFinancialContext, UserAccount } from "solomon-ai-typescript-sdk";
import { OpenAIModel } from "../../types/ai";

import { cn } from "../../utils/cn";

/**
 * Props for the SmartTextarea component.
 */
export interface SmartTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** The context for the textarea */
  context: any;
  /** Global financial context */
  globalFinancialContext: MelodyFinancialContext;
  /** Array of sample questions */
  sampleQuestions: string[];
  /** Whether to enable global context */
  enableGlobalContext?: boolean;
  /** User ID */
  userId: string;
  /** User name */
  userName: string;
  /** User account information */
  userAccount: UserAccount;
  /** Financial context */
  financialContext: MelodyFinancialContext;
  /** Optional callback for instrumentation */
  instrumentationCallback?: () => void;
  /** API token */
  apiToken: string;
  /** OpenAI model to use */
  model: OpenAIModel;
  /** Temperature for AI model */
  temperature: number;
  /** Top p value for AI model */
  top_p: number;
  /** Frequency penalty for AI model */
  frequency_penalty: number;
  /** Presence penalty for AI model */
  presence_penalty: number;
  /** Maximum tokens for AI model response */
  max_tokens: number;
}

/**
 * SmartTextarea component that combines a textarea with AI-powered features.
 *
 * @param props - The component props
 * @param ref - Forwarded ref for the textarea element
 * @returns A React functional component
 */
const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  (
    {
      context,
      sampleQuestions,
      globalFinancialContext,
      userAccount,
      className,
      userId,
      userName,
      financialContext,
      instrumentationCallback,
      apiToken,
      model,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      max_tokens,
      enableGlobalContext = false,
      ...props
    },
    ref,
  ) => {
    // TODO: Implement AI-powered features using the provided props

    return (
      <div
        className={cn(
          "flex flex-row rounded-md border-4 border-gray-50 bg-white shadow-md",
          className,
        )}
      >
        <textarea
          className={cn(
            "flex w-full rounded-md border-0 bg-transparent p-[1%] text-sm shadow-none",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);

SmartTextarea.displayName = "SmartTextarea";

export { SmartTextarea };
