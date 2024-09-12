import React from "react";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import type { Meta, StoryObj } from "@storybook/react";

import AssistantThreadWrapper from "./assistant-sidebar";

/**
 * A wrapper component that provides the necessary context for the AssistantThreadWrapper.
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
 * Storybook meta configuration for AssistantThreadWrapper.
 *
 * @type {Meta<typeof AssistantThreadWrapper>}
 */
const meta: Meta<typeof AssistantThreadWrapper> = {
  component: AssistantThreadWrapper,
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
 * Story type for AssistantThreadWrapper.
 *
 * @typedef {StoryObj<typeof AssistantThreadWrapper>} Story
 */
type Story = StoryObj<typeof AssistantThreadWrapper>;

/**
 * Default story for AssistantThreadWrapper.
 *
 * @type {Story}
 */
export const Default: Story = {
  args: {
    className: "w-full max-w-[500px]",
  },
};

/**
 * Story showing AssistantThreadWrapper with custom width.
 *
 * @type {Story}
 */
export const CustomWidth: Story = {
  args: {
    className: "w-full max-w-[800px]",
  },
};

/**
 * Story showing AssistantThreadWrapper with minimal styling.
 *
 * @type {Story}
 */
export const MinimalStyling: Story = {
  args: {
    className: "w-full",
  },
};
