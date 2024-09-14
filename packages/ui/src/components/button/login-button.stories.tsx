import { type Meta, type StoryObj } from "@storybook/react";

import { LogInButton } from "./login-button";

const meta: Meta<typeof LogInButton> = {
  component: LogInButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof LogInButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
