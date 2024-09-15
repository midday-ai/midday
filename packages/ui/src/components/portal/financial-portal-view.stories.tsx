import type { Meta, StoryObj } from "@storybook/react";
import { FinancialDataGenerator } from "../../lib/random/financial-data-generator";
import { FinancialPortalOverview } from "./financial-portal-view";

const meta: Meta<typeof FinancialPortalOverview> = {
  component: FinancialPortalOverview,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    financialProfile: {
      control: {
        type: "object",
      },
      defaultValue: FinancialDataGenerator.generateFinancialProfile(),
    },
    financialContext: {
      control: {
        type: "object",
      },
      defaultValue: FinancialDataGenerator.generateFinancialContext(),
    },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof FinancialPortalOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    financialProfile: FinancialDataGenerator.generateFinancialProfile(),
    financialContext: FinancialDataGenerator.generateFinancialContext(),
  },
};

export const WithMultipleLinkedAccounts: Story = {
  args: {
    financialProfile: {
      ...FinancialDataGenerator.generateFinancialProfile(),
      link: Array(3)
        .fill(null)
        .map(() => FinancialDataGenerator.generateRandomLink()),
    },
    financialContext: FinancialDataGenerator.generateFinancialContext(),
  },
};

export const NoLinkedAccounts: Story = {
  args: {
    financialProfile: {
      ...FinancialDataGenerator.generateFinancialProfile(),
      link: [],
    },
    financialContext: FinancialDataGenerator.generateFinancialContext(),
  },
};
