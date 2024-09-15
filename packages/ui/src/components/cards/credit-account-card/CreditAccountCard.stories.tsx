import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";
import { CreditAccountCard } from "./CreditAccountCard";

const meta: Meta<typeof CreditAccountCard> = {
  component: CreditAccountCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    creditAccount: {
      control: {
        type: "object",
      },
      defaultValue: FinancialDataGenerator.generateRandomCreditAccount(),
    },
    financialProfile: {
      control: {
        type: "object",
      },
      defaultValue: {},
    },
    className: {
      control: {
        type: "text",
      },
      defaultValue: "",
    },
    contextQuestions: {
      control: {
        type: "object",
      },
      defaultValue: [
        "How much money do I have in my account?",
        "Am l spending too much in my account?",
        "What fees are associated with my account?",
        "How can l optimize my spending on this account?",
      ],
    },
    enableDemoMode: {
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
    historicalAccountBalance: {
      control: {
        type: "object",
      },
      defaultValue:
        FinancialDataGenerator.generateRandomAccountBalanceHistories(50),
    },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof CreditAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreditAccountCardDefault: Story = {
  args: {
    // Adjust the default properties for each variant of your component
    // primary: true,
    // label: 'CreditAccountCard',
    creditAccount: FinancialDataGenerator.generateRandomCreditAccount(),
    enableDemoMode: false,
    institutionName: "Chase",
  },
};

export const CreditAccountCardAccountBalanceHistory: Story = {
  args: {
    // Adjust the default properties for each variant of your component
    // primary: true,
    // label: 'CreditAccountCard',
    creditAccount: FinancialDataGenerator.generateRandomCreditAccount(),
    enableDemoMode: false,
    institutionName: "Chase",
    historicalAccountBalance:
      FinancialDataGenerator.generateRandomAccountBalanceHistories(100).sort(
        (a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime(),
      ),
  },
};
