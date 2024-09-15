import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";
import { LinkedAccountCard } from "./linked-account-card";

const meta: Meta<typeof LinkedAccountCard> = {
  component: LinkedAccountCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    link: {
      control: {
        type: "object",
      },
      defaultValue: FinancialDataGenerator.generateRandomLink(),
    },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof LinkedAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreditAccountCardDefault: Story = {
  args: {
    link: FinancialDataGenerator.generateRandomLink(),
  },
};

export const CreditAccountCardAccountBalanceHistory: Story = {
  args: {
    link: FinancialDataGenerator.generateRandomLink(),
  },
};
