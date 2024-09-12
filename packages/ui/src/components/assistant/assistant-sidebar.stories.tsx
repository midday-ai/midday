import React from "react";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import type { Meta, StoryObj } from "@storybook/react";

import AssistantSidebarWrapper from "./assistant-sidebar";

/**
 * A wrapper component that provides the necessary context for the AssistantSidebarWrapper.
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
 * Storybook meta configuration for AssistantSidebarWrapper.
 *
 * @type {Meta<typeof AssistantSidebarWrapper>}
 */
const meta: Meta<typeof AssistantSidebarWrapper> = {
  component: AssistantSidebarWrapper,
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
 * Story type for AssistantSidebarWrapper.
 *
 * @typedef {StoryObj<typeof AssistantSidebarWrapper>} Story
 */
type Story = StoryObj<typeof AssistantSidebarWrapper>;

/**
 * Default story for AssistantSidebarWrapper.
 *
 * @type {Story}
 */
export const Default: Story = {
  render: () => <AssistantSidebarWrapper className="w-full" />,
};
