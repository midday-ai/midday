import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import AssistantProviderWrapper from "../../../../wrapper/assistant-provider-wrapper";
import { Meta, StoryFn } from "@storybook/react";
import { SpendingOverTime, SpendingOverTimeProps } from "./spending-over-time";

const ExpenseMetricsData = FinancialDataGenerator.generateExpenseMetricsAcrossManyYears(
    2022,
    2024,
);

const transactions = FinancialDataGenerator.generateRandomTransactions(100);

export default {
    component: SpendingOverTime,
    parameters: {
        layout: "centered",
    },
    argTypes: {
        currency: {
            control: "select",
            options: ["USD", "EUR", "GBP", "JPY"],
        },
        height: {
            control: { type: "range", min: 200, max: 600, step: 10 },
        },
        enableAssistantMode: {
            control: "boolean",
        },
        locale: {
            control: "select",
            options: ["en-US", "de-DE", "fr-FR", "ja-JP"],
        },
    },
    decorators: [
        (Story) => (
            <AssistantProviderWrapper>
                <Story />
            </AssistantProviderWrapper>
        ),
    ],
} as Meta;

const Template: StoryFn<SpendingOverTimeProps> = (
    args: JSX.IntrinsicAttributes & SpendingOverTimeProps,
) => (
    <div className="w-[900px]">
        <SpendingOverTime {...args} />
    </div>
);

export const Default = Template.bind({});
Default.args = {
    title: "Monthly spending",
    viewMoreHref: "/net-Expense",
    price: 1000,
    priceChange: 10,
    expenseMetrics: ExpenseMetricsData,
    transactions: transactions,
};

export const DisabledChart = Template.bind({});
DisabledChart.args = {
    ...Default.args,
    disabled: true,
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
    ...Default.args,
    className: "bg-gray-100 shadow-lg rounded-xl",
};
