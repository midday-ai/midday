import { type Meta, type StoryObj } from "@storybook/react";

import AssistantButton from "./assistant-button";

const meta: Meta<typeof AssistantButton> = {
  component: AssistantButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof AssistantButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
