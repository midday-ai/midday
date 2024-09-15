import { type Meta, type StoryObj } from "@storybook/react";

import { FinancialPortalButton } from "./financial-portal-button";

const meta: Meta<typeof FinancialPortalButton> = {
  component: FinancialPortalButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof FinancialPortalButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
