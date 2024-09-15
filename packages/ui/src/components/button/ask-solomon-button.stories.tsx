import { type Meta, type StoryObj } from "@storybook/react";

import { AskSolomonAiButton } from "./ask-solomon-button";

const meta: Meta<typeof AskSolomonAiButton> = {
  component: AskSolomonAiButton,
  argTypes: {
    active: {
      control: "boolean",
      defaultValue: false, // Default value
    },
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
    href: {
      control: "text",
      defaultValue: false, // Default value
    },
    label: {
      control: "text",
      defaultValue: false, // Default value
    },
    asChild: {
      control: "boolean",
      defaultValue: false, // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof AskSolomonAiButton>;

export const Default: Story = {};

export const ButtonWithCustomLabel: Story = {
  args: {
    label: "custom label",
  },
};

export const InactiveButton: Story = {
  args: {
    active: false,
  },
};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
