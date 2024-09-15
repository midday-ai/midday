import { type Meta, type StoryObj } from "@storybook/react";

import { MyProfileButton } from "./my-profile-button";

const meta: Meta<typeof MyProfileButton> = {
  component: MyProfileButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof MyProfileButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
