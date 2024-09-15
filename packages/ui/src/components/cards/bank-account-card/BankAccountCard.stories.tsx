import type { Meta, StoryObj } from "@storybook/react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";
import { BankAccountCard } from "./BankAccountCard";

const meta: Meta<typeof BankAccountCard> = {
  component: BankAccountCard,
  tags: ["autodocs"],
  argTypes: {
    bankAccount: {
      control: {
        type: "object",
      },
      defaultValue: FinancialDataGenerator.generateRandomBankAccount(),
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
} satisfies Meta<typeof BankAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegularBankAccountCardWithDemoModeDisabled: Story = {
  args: {
    bankAccount: FinancialDataGenerator.generateRandomBankAccount(),
    enableDemoMode: false,
    // historicalAccountBalance: Array.from({ length: 20 }, () =>
    //   AccountBalanceHistory.randomInstance(),
    // ).sort((a, b) => a.time!.getTime() - b.time!.getTime()),
  },
};

export const RegularBankAccountCardWithHistoricalBankAccountBalance: Story = {
  args: {
    bankAccount: FinancialDataGenerator.generateRandomBankAccount(),
    historicalAccountBalance:
      FinancialDataGenerator.generateRandomAccountBalanceHistories(150).sort(
        (a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime(),
      ),
  },
};

export const RegularBankAccountCardWithDemoModeEnabled: Story = {
  args: {
    bankAccount: FinancialDataGenerator.generateRandomBankAccount(),
    enableDemoMode: true,
  },
};

export const RegularBankAccountCardWithClassName: Story = {
  args: {
    bankAccount: FinancialDataGenerator.generateRandomBankAccount(),
    className: "border rounded-md",
  },
};
