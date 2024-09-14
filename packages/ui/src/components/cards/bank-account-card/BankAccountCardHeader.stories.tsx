// BankAccountCardHeader.stories.tsx
import { Meta, StoryObj } from "@storybook/react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";

import { BankAccountContext } from "./BankAccountCard";
import { BankAccountCardHeader } from "./BankAccountCardHeader";

import React from "react";
// Mock data for the bank account
const mockBankAccount = FinancialDataGenerator.generateRandomBankAccount();

const meta: Meta<typeof BankAccountCardHeader> = {
  component: BankAccountCardHeader,
  argTypes: {
    serverUrl: { control: "text" },
  },
  decorators: [
    (Story) => (
      <BankAccountContext.Provider value={mockBankAccount}>
        <Story />
      </BankAccountContext.Provider>
    ),
  ],
} as Meta;

export default meta;

type Story = StoryObj<typeof BankAccountCardHeader>;

export const Default: Story = {};
