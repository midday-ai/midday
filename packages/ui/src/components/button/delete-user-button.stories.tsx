import { type Meta, type StoryObj } from "@storybook/react";

import { DeleteUserButton } from "./delete-user-button";

const meta: Meta<typeof DeleteUserButton> = {
  component: DeleteUserButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof DeleteUserButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
