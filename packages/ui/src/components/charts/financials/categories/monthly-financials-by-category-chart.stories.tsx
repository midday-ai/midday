import React from "react";
import { JSX } from "react/jsx-runtime";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";

import {
  MonthlyFinancialByCategoryChart,
  MonthlyFinancialByCategoryChartProps,
} from "./monthly-financials-by-category-chart";

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
  component: MonthlyFinancialByCategoryChart,
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

const categoryMonthlyIncome =
  FinancialDataGenerator.generateUserCategoryMonthlyData(1000, 2022, "income");
const categoryMonthlyExpense =
  FinancialDataGenerator.generateUserCategoryMonthlyData(1000, 2022, "expense");

const Template: StoryFn<MonthlyFinancialByCategoryChartProps> = (
  args: JSX.IntrinsicAttributes & MonthlyFinancialByCategoryChartProps,
) => (
  <div className="w-[900px]">
    <MonthlyFinancialByCategoryChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currency: "USD",
  data: categoryMonthlyIncome,
  type: "income",
  height: 290,
  locale: "en-US",
  enableAssistantMode: true,
};

export const IncomeChart = Template.bind({});
IncomeChart.args = {
  ...Default.args,
  data: categoryMonthlyIncome,
  type: "income",
  currency: "USD",
  enableAssistantMode: true,
};

export const ExpenseChart = Template.bind({});
ExpenseChart.args = {
  ...Default.args,
  data: categoryMonthlyExpense,
  type: "expense",
  currency: "USD",
  enableAssistantMode: true,
};

export const ExpenseChartWithEnabledDrilldown = Template.bind({});
ExpenseChartWithEnabledDrilldown.args = {
  ...Default.args,
  data: categoryMonthlyExpense,
  type: "expense",
  currency: "USD",
  enableAssistantMode: true,
  enableDrillDown: true,
};
