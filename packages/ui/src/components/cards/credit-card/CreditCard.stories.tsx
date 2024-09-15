// CreditCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";

import React from "react";
import { CreditCard } from "./CreditCard";

const meta: Meta<typeof CreditCard> = {
  component: CreditCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    cardType: {
      control: {
        type: "select",
        options: ["Visa", "MasterCard", "Amex", "Discover"],
      },
    },
  },
  decorators: [(Story) => <Story />],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultCard: Story = {
  args: {
    cardholderName: "John Doe",
    cardNumber: "1234 5678 9012 3456",
    expiryDate: "12/24",
    cvv: "123",
  },
};

export const VisaCard: Story = {
  args: {
    cardholderName: "Jane Smith",
    cardNumber: "4111 1111 1111 1111",
    expiryDate: "06/25",
    cvv: "456",
    cardType: "Visa",
  },
};

export const MasterCardExample: Story = {
  args: {
    cardholderName: "Samuel Jackson",
    cardNumber: "5555 5555 5555 4444",
    expiryDate: "09/23",
    cvv: "789",
    cardType: "MasterCard",
  },
};

export const AmexCard: Story = {
  args: {
    cardholderName: "Emma Watson",
    cardNumber: "3782 822463 10005",
    expiryDate: "10/26",
    cvv: "1122",
    cardType: "Amex",
  },
};

export const DiscoverCard: Story = {
  args: {
    cardholderName: "Robert Downey Jr.",
    cardNumber: "6011 1111 1111 1117",
    expiryDate: "02/28",
    cvv: "333",
    cardType: "Discover",
  },
};
