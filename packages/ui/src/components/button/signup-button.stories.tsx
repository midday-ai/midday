import { type Meta, type StoryObj } from "@storybook/react";

import { SignUpButton } from "./signup-button";

const meta: Meta<typeof SignUpButton> = {
  component: SignUpButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof SignUpButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};