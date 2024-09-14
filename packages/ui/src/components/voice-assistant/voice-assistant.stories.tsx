import { type Meta, type StoryObj } from "@storybook/react";

import VoiceAssistantForm from "./voice-assistant";

const meta: Meta<typeof VoiceAssistantForm> = {
  component: VoiceAssistantForm,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof VoiceAssistantForm>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};

export const ButtonWithVoiceMode: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
    mode: "voice",
  },
};
