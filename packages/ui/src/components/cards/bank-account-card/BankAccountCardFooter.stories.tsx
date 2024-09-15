// BankAccountCardHeader.stories.tsx
import { Meta, StoryObj } from "@storybook/react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";

import React from "react";
import {
  AccountBalanceHistoryContext,
  BankAccountContext,
} from "./BankAccountCard";
import { BankAccountCardFooter } from "./BankAccountCardFooter";

// Mock data for the bank account
const mockBankAccount = FinancialDataGenerator.generateRandomBankAccount();
const historicalAccountBalance =
  FinancialDataGenerator.generateRandomAccountBalanceHistories(100);

const meta: Meta<typeof BankAccountCardFooter> = {
  component: BankAccountCardFooter,
  argTypes: {
    serverUrl: { control: "text" },
  },
  decorators: [
    (Story) => (
      <BankAccountContext.Provider value={mockBankAccount}>
        <AccountBalanceHistoryContext.Provider value={historicalAccountBalance}>
          <Story />
        </AccountBalanceHistoryContext.Provider>
      </BankAccountContext.Provider>
    ),
  ],
} as Meta;

export default meta;

type Story = StoryObj<typeof BankAccountCardFooter>;

export const Default: Story = {};
