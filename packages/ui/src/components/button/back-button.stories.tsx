import { type Meta, type StoryObj } from "@storybook/react";

import { BackButton } from "./back-button";

const meta: Meta<typeof BackButton> = {
  component: BackButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof BackButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
