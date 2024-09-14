import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";

import {
    MonthlySpendingChart,
    MonthlySpendingChartProps,
} from "./financial-dashboard-overview";

/**
 * A wrapper component that provides the necessary context for the AssistantModalWrapper.
 *
 * @component
 */
const AssistantProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const assistant = useAssistant({
        api: "/api/assistant", // Adjust this if your API endpoint is different
    });

    const runtime = useVercelUseAssistantRuntime(assistant);

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            {children}
        </AssistantRuntimeProvider>
    );
};

export default {
    component: MonthlySpendingChart,
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
    },
    decorators: [
        (Story) => (
            <AssistantProviderWrapper>
                <Story />
            </AssistantProviderWrapper>
        ),
    ],
} as Meta;

const incomeMetricsData = FinancialDataGenerator.generateIncomeMetrics(
    30,
    2022,
);
const expenseMetricsData = FinancialDataGenerator.generateRandomExpenseMetrics(
    30,
    2022,
);
const transactions = FinancialDataGenerator.generateRandomTransactions(5);

const Template: StoryFn<MonthlySpendingChartProps> = (
    args: JSX.IntrinsicAttributes & MonthlySpendingChartProps,
) => (
    <div className="w-[900px]">
        <MonthlySpendingChart {...args} />
    </div>
);

export const Default = Template.bind({});
Default.args = {
    transactions: transactions,
    expenseMetrics: expenseMetricsData,
    incomeMetrics: incomeMetricsData,
};
