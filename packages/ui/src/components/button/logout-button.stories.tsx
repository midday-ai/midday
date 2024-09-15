import { type Meta, type StoryObj } from "@storybook/react";

import { LogoutButton } from "./logout-button";

const meta: Meta<typeof LogoutButton> = {
  component: LogoutButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof LogoutButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};

export const ButtonWithCallback: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
    callback: () => {
      alert("Logout Successful");
    },
  },
};

export const ButtonWithNavigationProps: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
    variant: "navigation",
  },
};

export const ButtonWithNavigationPropsAndCallback: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
    variant: "navigation",
    callback: () => {
      alert("Logout Successful");
    },
  },
};
