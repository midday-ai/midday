import React from "react";
import { JSX } from "react/jsx-runtime";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";

import {
  MerchantFinancialChart,
  MerchantFinancialChartProps,
} from "./merchant-chart";

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
  component: MerchantFinancialChart,
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

const data =
  FinancialDataGenerator.generateRandomMerchantMetricsFinancialSubProfile(
    150,
    2023,
  );

const Template: StoryFn<MerchantFinancialChartProps> = (
  args: JSX.IntrinsicAttributes & MerchantFinancialChartProps,
) => (
  <div className="w-[900px]">
    <MerchantFinancialChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currency: "USD",
  data: data,
  height: 290,
  locale: "en-US",
  enableAssistantMode: true,
};

export const MerchantChart = Template.bind({});
MerchantChart.args = {
  ...Default.args,
  data: data,
  currency: "USD",
};
