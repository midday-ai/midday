import React from "react";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import type { Meta, StoryObj } from "@storybook/react";

import { AssistantChatGPT } from "./assistant-chatgpt";

/**
 * A wrapper component that provides the necessary context for the AssistantChatGPT.
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
 * Storybook meta configuration for AssistantChatGPT.
 *
 * @type {Meta<typeof AssistantChatGPT>}
 */
const meta: Meta<typeof AssistantChatGPT> = {
  component: AssistantChatGPT,
  decorators: [
    (Story) => (
      <AssistantProviderWrapper>
        <Story />
      </AssistantProviderWrapper>
    ),
  ],
  argTypes: {
    className: { control: "text" },
    // Add other props here if AssistantChatGPT accepts any
  },
};

export default meta;

/**
 * Story type for AssistantChatGPT.
 *
 * @typedef {StoryObj<typeof AssistantChatGPT>} Story
 */
type Story = StoryObj<typeof AssistantChatGPT>;

/**
 * Default story for AssistantChatGPT.
 *
 * @type {Story}
 */
export const Default: Story = {
  args: {
    className: "w-full max-w-[500px]",
  },
};

/**
 * Story showing AssistantChatGPT with custom width.
 *
 * @type {Story}
 */
export const CustomWidth: Story = {
  args: {
    className: "w-full max-w-[800px]",
  },
};

/**
 * Story showing AssistantChatGPT with minimal styling.
 *
 * @type {Story}
 */
export const MinimalStyling: Story = {
  args: {
    className: "w-full",
  },
};
