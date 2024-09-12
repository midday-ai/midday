import React from "react";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import type { Meta, StoryObj } from "@storybook/react";

import { StandaloneAssistant } from "./assistant-standalone";

/**
 * A wrapper component that provides the necessary context for the StandaloneAssistant.
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
 * Storybook meta configuration for StandaloneAssistant.
 *
 * @type {Meta<typeof StandaloneAssistant>}
 */
const meta: Meta<typeof StandaloneAssistant> = {
  component: StandaloneAssistant,
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
 * Story type for StandaloneAssistant.
 *
 * @typedef {StoryObj<typeof StandaloneAssistant>} Story
 */
type Story = StoryObj<typeof StandaloneAssistant>;

/**
 * Default story for StandaloneAssistant.
 *
 * @type {Story}
 */
export const Default: Story = {
  args: {
    className: "w-full max-w-[500px]",
  },
};

/**
 * Story showing StandaloneAssistant with custom width.
 *
 * @type {Story}
 */
export const CustomWidth: Story = {
  args: {
    className: "w-full max-w-[800px]",
  },
};

/**
 * Story showing StandaloneAssistant with minimal styling.
 *
 * @type {Story}
 */
export const MinimalStyling: Story = {
  args: {
    className: "w-full",
  },
};
