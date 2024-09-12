import React from "react";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import type { Meta, StoryObj } from "@storybook/react";

import AssistantModalWrapper from "./assistant-modal-wrapper";

/**
 * A wrapper component that provides the necessary context for the AssistantModalWrapper.
 *
 * @component
 */
const AssistantProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const assistant = useAssistant({
    api: "/api/assistant", // Adjust this if your API endpoint is different
  });

  const runtime = useVercelUseAssistantRuntime(assistant);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};

/**
 * Storybook meta configuration for AssistantModalWrapper.
 *
 * @type {Meta<typeof AssistantModalWrapper>}
 */
const meta: Meta<typeof AssistantModalWrapper> = {
  component: AssistantModalWrapper,
  decorators: [
    (Story) => (
      <AssistantProviderWrapper>
        <Story />
      </AssistantProviderWrapper>
    ),
  ],
};

export default meta;

/**
 * Story type for AssistantModalWrapper.
 *
 * @typedef {StoryObj<typeof AssistantModalWrapper>} Story
 */
type Story = StoryObj<typeof AssistantModalWrapper>;

/**
 * Default story for AssistantModalWrapper.
 *
 * @type {Story}
 */
export const Default: Story = {
  render: () => <AssistantModalWrapper className="w-full max-w-[500px]" />,
};
