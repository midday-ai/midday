import { type Meta, type StoryObj } from "@storybook/react";

import { FeedbackButton } from "./feedback-button";

const meta: Meta<typeof FeedbackButton> = {
  component: FeedbackButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof FeedbackButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
