import type { Meta, StoryObj } from "@storybook/react";
import { FinancialDataGenerator } from "../../lib/random/financial-data-generator";
import { CreditAccountsOverviewSummary } from "./credit-account-portal-view";

const meta: Meta<typeof CreditAccountsOverviewSummary> = {
    component: CreditAccountsOverviewSummary,
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
        transactions: {
            control: {
                type: "object",
            },
            defaultValue: FinancialDataGenerator.generateRandomTransactions(20),
        },
    },
    decorators: [(Story) => <Story />],
} satisfies Meta<typeof CreditAccountsOverviewSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        financialProfile: FinancialDataGenerator.generateFinancialProfile(),
        financialContext: FinancialDataGenerator.generateFinancialContext(),
        transactions: FinancialDataGenerator.generateRandomTransactions(20),
    },
};

export const WithMultipleLinkedAccounts: Story = {
    args: {
        financialProfile: {
            ...FinancialDataGenerator.generateFinancialProfile(),
            link: Array(3).fill(null).map(() => FinancialDataGenerator.generateRandomLink()),
        },
        financialContext: FinancialDataGenerator.generateFinancialContext(),
        transactions: FinancialDataGenerator.generateRandomTransactions(20),
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