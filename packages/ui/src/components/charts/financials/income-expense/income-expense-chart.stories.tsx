import React from "react";
import { JSX } from "react/jsx-runtime";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";

import {
  IncomeExpenseChart,
  IncomeExpenseChartProps,
} from "./income-expense-chart";

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
  component: IncomeExpenseChart,
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

const Template: StoryFn<IncomeExpenseChartProps> = (
  args: JSX.IntrinsicAttributes & IncomeExpenseChartProps,
) => (
  <div className="w-[900px]">
    <IncomeExpenseChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currency: "USD",
  data: incomeMetricsData,
  type: "income",
  height: 290,
  locale: "en-US",
  enableAssistantMode: true,
};

export const IncomeChart = Template.bind({});
IncomeChart.args = {
  ...Default.args,
  data: incomeMetricsData,
  type: "income",
  currency: "USD",
};

export const ExpenseChart = Template.bind({});
ExpenseChart.args = {
  ...Default.args,
  data: expenseMetricsData,
  type: "expense",
  currency: "USD",
};

export const ExpenseChartWithDrilldown = Template.bind({});
ExpenseChartWithDrilldown.args = {
  ...Default.args,
  data: expenseMetricsData,
  type: "expense",
  currency: "USD",
  enableDrillDown: true,
};
