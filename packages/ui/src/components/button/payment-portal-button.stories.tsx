import { type Meta, type StoryObj } from "@storybook/react";

import { PaymentPortalButton } from "./payment-portal-button";

const meta: Meta<typeof PaymentPortalButton> = {
  component: PaymentPortalButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof PaymentPortalButton>;

export const Default: Story = {};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
