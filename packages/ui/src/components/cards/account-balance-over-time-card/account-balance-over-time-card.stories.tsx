import { StoryObj, type Meta } from "@storybook/react";
import * as React from "react";
import { FinancialDataGenerator } from "../../../lib/random/financial-data-generator";
import { AccountBalanceOverTimeCard } from "./account-balance-over-time-card";

const meta: Meta<typeof AccountBalanceOverTimeCard> = {
  component: AccountBalanceOverTimeCard,
  argTypes: {
    accountBalanceHistory: {
      control: {
        type: "object",
      },
      defaultValue: "",
    },
  },
  decorators: [(Story) => <Story />],
};

export default meta;

type Story = StoryObj<typeof AccountBalanceOverTimeCard>;

export const Default: Story = {
  args: {
    accountBalanceHistory:
      FinancialDataGenerator.generateRandomAccountBalanceHistories(50),
  },
};

export const AccountBalanceHistoryCardWithBasicHistories: Story = {
  args: {
    accountBalanceHistory:
      FinancialDataGenerator.generateRandomAccountBalanceHistories(50),
  },
};

export const AccountBalanceHistoryCardWithClassName: Story = {
  args: {
    accountBalanceHistory:
      FinancialDataGenerator.generateRandomAccountBalanceHistories(50),
    className: "border rounded-md",
  },
};
